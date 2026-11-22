import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { Colors, Typography } from '../theme';

export default function Avatar({ name, photoURL, size = 36, style, onPress }) {
  const initials = name
    ? name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2)
    : 'U';

  const inner = photoURL ? (
    <Image source={{ uri: photoURL }} style={[styles.img, { width: size, height: size, borderRadius: size / 2 }]} />
  ) : (
    <View style={[styles.placeholder, { width: size, height: size, borderRadius: size / 2 }]}>
      <Text style={[styles.initials, { fontSize: size * 0.36 }]}>{initials}</Text>
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity style={style} onPress={onPress} activeOpacity={0.8}>
        {inner}
      </TouchableOpacity>
    );
  }
  return <View style={style}>{inner}</View>;
}

const styles = StyleSheet.create({
  img: {
    resizeMode: 'cover',
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  placeholder: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surfaceElevated,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  initials: {
    fontFamily: Typography.sansSemiBold,
    color: Colors.text,
  },
});
