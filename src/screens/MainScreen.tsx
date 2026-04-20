delivery_main_screen = '''import React, { useEffect, useState, useRef } from 'react';
import {
View,
Text,
StyleSheet,
TouchableOpacity,
Switch,
Dimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import MapView, { Marker, Polyline } from 'react-native-maps';
import Geolocation from 'react-native-geolocation-service';
import LinearGradient from 'react-native-linear-gradient';
import io from 'socket.io-client';

import { colors, gradients, spacing, borderRadius } from '../constants/colors';
import { GlassCard } from '../components/GlassCard';
import api from '../constants/api';
import { showMessage } from 'react-native-flash-message';

const { width, height } = Dimensions.get('window');

const DeliveryMainScreen = () => {
const [isOnline, setIsOnline] = useState(false);
const [currentOrder, setCurrentOrder] = useState(null);
const [location, setLocation] = useState(null);
const [earnings, setEarnings] = useState({ today: 0, total: 0 });
const socketRef = useRef(null);
const locationInterval = useRef(null);

useEffect(() => {
// Connect socket
socketRef.current = io('https://your-api-url.com');

socketRef.current.on('new_assignment', (order) => {  
  setCurrentOrder(order);  
  showMessage({  
    message: 'New Order!',  
    description: 'You have a new delivery assignment',  
    type: 'info',  
  });  
});  

return () => {  
  if (socketRef.current) {  
    socketRef.current.disconnect();  
  }  
  if (locationInterval.current) {  
    clearInterval(locationInterval.current);  
  }  
};

}, []);

useEffect(() => {
if (isOnline) {
startLocationTracking();
} else {
stopLocationTracking();
}
}, [isOnline]);

const startLocationTracking = () => {
locationInterval.current = setInterval(() => {
Geolocation.getCurrentPosition(
(position) => {
const { latitude, longitude } = position.coords;
setLocation({ lat: latitude, lng: longitude });

// Send to server  
      api.put('/api/delivery/location', {  
        lat: latitude,  
        lng: longitude,  
      });  
        
      // Emit via socket  
      socketRef.current?.emit('update_location', {  
        lat: latitude,  
        lng: longitude,  
        orderId: currentOrder?._id,  
      });  
    },  
    (error) => console.error('Location Error:', error),  
    { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }  
  );  
}, 10000); // Update every 10 seconds

};

const stopLocationTracking = () => {
if (locationInterval.current) {
clearInterval(locationInterval.current);
}
};

const toggleOnlineStatus = async () => {
try {
const newStatus = !isOnline;
await api.patch('/api/delivery/toggle-status', {
isOnline: newStatus,
location,
});
setIsOnline(newStatus);

showMessage({  
    message: newStatus ? 'You are Online' : 'You are Offline',  
    type: newStatus ? 'success' : 'warning',  
  });  
} catch (error) {  
  showMessage({  
    message: 'Error',  
    description: 'Failed to update status',  
    type: 'danger',  
  });  
}

};

const updateOrderStatus = async (status) => {
try {
await api.put(/api/delivery/orders/${currentOrder._id}/status, { status });

if (status === 'delivered') {  
    setCurrentOrder(null);  
    showMessage({  
      message: 'Order Delivered!',  
      description: 'Great job! Earnings updated.',  
      type: 'success',  
    });  
  } else {  
    setCurrentOrder({ ...currentOrder, status });  
  }  
} catch (error) {  
  showMessage({  
    message: 'Error',  
    description: 'Failed to update order',  
    type: 'danger',  
  });  
}

};

return (
<View style={styles.container}>
{/* Map */}
<MapView
style={styles.map}
initialRegion={{
latitude: 28.6139,
longitude: 77.2090,
latitudeDelta: 0.0922,
longitudeDelta: 0.0421,
}}
>
{location && (
<Marker
coordinate={{ latitude: location.lat, longitude: location.lng }}
title="You are here"
>
<View style={styles.currentLocationMarker}>
<View style={styles.currentLocationDot} />
</View>
</Marker>
)}

{currentOrder && (  
      <>  
        <Marker  
          coordinate={{  
            latitude: currentOrder.restaurant?.location?.coordinates?.[1] || 28.6139,  
            longitude: currentOrder.restaurant?.location?.coordinates?.[0] || 77.2090,  
          }}  
          title="Pickup"  
        >  
          <View style={styles.pickupMarker}>  
            <Icon name="restaurant" size={16} color={colors.text} />  
          </View>  
        </Marker>  
          
        <Marker  
          coordinate={{  
            latitude: currentOrder.deliveryAddress?.coordinates?.[1] || 28.6139,  
            longitude: currentOrder.deliveryAddress?.coordinates?.[0] || 77.2090,  
          }}  
          title="Drop"  
        >  
          <View style={styles.dropMarker}>  
            <Icon name="home" size={16} color={colors.text} />  
          </View>  
        </Marker>  
      </>  
    )}  
  </MapView>  

  {/* Header */}  
  <LinearGradient colors={['rgba(0,0,0,0.8)', 'transparent']} style={styles.header}>  
    <View style={styles.headerContent}>  
      <View>  
        <Text style={styles.earningsLabel}>Today's Earnings</Text>  
        <Text style={styles.earningsValue}>₹{earnings.today}</Text>  
      </View>  
      <TouchableOpacity  
        style={[styles.onlineButton, isOnline && styles.onlineButtonActive]}  
        onPress={toggleOnlineStatus}  
      >  
        <Text style={[styles.onlineButtonText, isOnline && styles.onlineButtonTextActive]}>  
          {isOnline ? 'ONLINE' : 'OFFLINE'}  
        </Text>  
      </TouchableOpacity>  
    </View>  
  </LinearGradient>  

  {/* Current Order Card */}  
  {currentOrder && (  
    <View style={styles.orderCardContainer}>  
      <GlassCard style={styles.orderCard}>  
        <View style={styles.orderHeader}>  
          <Text style={styles.orderId}>{currentOrder.orderId}</Text>  
          <View style={styles.statusBadge}>  
            <Text style={styles.statusText}>{currentOrder.status}</Text>  
          </View>  
        </View>  

        <View style={styles.addressSection}>  
          <Icon name="restaurant-outline" size={20} color={colors.primary} />  
          <View style={styles.addressInfo}>  
            <Text style={styles.addressLabel}>Pickup</Text>  
            <Text style={styles.addressText}>{currentOrder.restaurant?.name}</Text>  
          </View>  
        </View>  

        <View style={styles.divider} />  

        <View style={styles.addressSection}>  
          <Icon name="home-outline" size={20} color={colors.success} />  
          <View style={styles.addressInfo}>  
            <Text style={styles.addressLabel}>Drop</Text>  
            <Text style={styles.addressText} numberOfLines={2}>  
              {currentOrder.deliveryAddress?.full}  
            </Text>  
          </View>  
        </View>  

        {/* Action Buttons */}  
        <View style={styles.actionButtons}>  
          {currentOrder.status === 'out_for_delivery' && (  
            <TouchableOpacity  
              style={[styles.actionButton, styles.pickupButton]}  
              onPress={() => updateOrderStatus('picked_up')}  
            >  
              <Text style={styles.actionButtonText}>Mark Picked Up</Text>  
            </TouchableOpacity>  
          )}  
            
          {currentOrder.status === 'picked_up' && (  
            <TouchableOpacity  
              style={[styles.actionButton, styles.deliverButton]}  
              onPress={() => updateOrderStatus('delivered')}  
            >  
              <Text style={styles.actionButtonText}>Mark Delivered</Text>  
            </TouchableOpacity>  
          )}  
            
          <TouchableOpacity style={styles.callButton}>  
            <Icon name="call" size={24} color={colors.success} />  
          </TouchableOpacity>  
        </View>  
      </GlassCard>  
    </View>  
  )}  
</View>

);
};

const styles = StyleSheet.create({
container: {
flex: 1,
backgroundColor: colors.background,
},
map: {
...StyleSheet.absoluteFillObject,
},
header: {
position: 'absolute',
top: 0,
left: 0,
right: 0,
paddingTop: 60,
paddingHorizontal: spacing.lg,
paddingBottom: spacing.xl,
},
headerContent: {
flexDirection: 'row',
justifyContent: 'space-between',
alignItems: 'center',
},
earningsLabel: {
fontSize: 12,
color: colors.textSecondary,
},
earningsValue: {
fontSize: 24,
fontWeight: 'bold',
color: colors.text,
},
onlineButton: {
paddingHorizontal: spacing.md,
paddingVertical: spacing.sm,
borderRadius: borderRadius.full,
backgroundColor: colors.surface,
},
onlineButtonActive: {
backgroundColor: colors.success,
},
onlineButtonText: {
color: colors.textMuted,
fontWeight: 'bold',
fontSize: 12,
},
onlineButtonTextActive: {
color: colors.text,
},
currentLocationMarker: {
width: 24,
height: 24,
borderRadius: 12,
backgroundColor: colors.primary + '30',
justifyContent: 'center',
alignItems: 'center',
},
currentLocationDot: {
width: 12,
height: 12,
borderRadius: 6,
backgroundColor: colors.primary,
borderWidth: 2,
borderColor: colors.text,
},
pickupMarker: {
width: 36,
height: 36,
borderRadius: 18,
backgroundColor: colors.primary,
justifyContent: 'center',
alignItems: 'center',
borderWidth: 3,
borderColor: colors.text,
},
dropMarker: {
width: 36,
height: 36,
borderRadius: 18,
backgroundColor: colors.success,
justifyContent: 'center',
alignItems: 'center',
borderWidth: 3,
borderColor: colors.text,
},
orderCardContainer: {
position: 'absolute',
bottom: 0,
left: 0,
right: 0,
padding: spacing.lg,
},
orderCard: {
padding: spacing.md,
},
orderHeader: {
flexDirection: 'row',
justifyContent: 'space-between',
alignItems: 'center',
marginBottom: spacing.md,
},
orderId: {
fontSize: 16,
fontWeight: 'bold',
color: colors.text,
},
statusBadge: {
backgroundColor: colors.primary + '30',
paddingHorizontal: 8,
paddingVertical: 4,
borderRadius: borderRadius.sm,
},
statusText: {
color: colors.primary,
fontSize: 10,
fontWeight: 'bold',
},
addressSection: {
flexDirection: 'row',
alignItems: 'flex-start',
marginBottom: spacing.sm,
},
addressInfo: {
marginLeft: spacing.sm,
flex: 1,
},
addressLabel: {
fontSize: 12,
color: colors.textSecondary,
marginBottom: 2,
},
addressText: {
fontSize: 14,
color: colors.text,
fontWeight: '500',
},
divider: {
height: 1,
backgroundColor: colors.surfaceLight,
marginVertical: spacing.sm,
},
actionButtons: {
flexDirection: 'row',
gap: spacing.sm,
marginTop: spacing.md,
},
actionButton: {
flex: 1,
paddingVertical: spacing.md,
borderRadius: borderRadius.md,
alignItems: 'center',
},
pickupButton: {
backgroundColor: colors.primary,
},
deliverButton: {
backgroundColor: colors.success,
},
actionButtonText: {
color: colors.text,
fontWeight: 'bold',
fontSize: 16,
},
callButton: {
width: 50,
height: 50,
borderRadius: 25,
backgroundColor: colors.success + '20',
justifyContent: 'center',
alignItems: 'center',
},
});

export default DeliveryMainScreen;
'''

with open("/mnt/kimi/output/foodflow-ecosystem/delivery-app/src/screens/MainScreen.tsx", "w") as f:
f.write(delivery_main_screen)
