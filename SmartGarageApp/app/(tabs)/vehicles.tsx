import { StyleSheet, View, Text } from 'react-native';

export default function VehiclesScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Màn hình quản lý xe đang được phát triển...</Text>
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
