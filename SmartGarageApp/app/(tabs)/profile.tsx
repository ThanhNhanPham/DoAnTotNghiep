import { StyleSheet, View, Text } from 'react-native';

export default function ProfileScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Màn hình cá nhân đang được phát triển...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  text: {
    fontSize: 16,
    color: '#6B7280',
  },
});
