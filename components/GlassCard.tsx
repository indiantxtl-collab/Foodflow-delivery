delivery_glass_card = '''import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { colors, borderRadius } from '../constants/colors';

interface GlassCardProps {
children: React.ReactNode;
style?: ViewStyle;
}

export const GlassCard: React.FC<GlassCardProps> = ({ children, style }) => {
return (
<View style={[styles.container, style]}>
{children}
</View>
);
};

const styles = StyleSheet.create({
container: {
backgroundColor: 'rgba(255, 255, 255, 0.05)',
borderRadius: borderRadius.lg,
borderWidth: 1,
borderColor: 'rgba(255, 255, 255, 0.1)',
padding: 16,
},
});
'''
