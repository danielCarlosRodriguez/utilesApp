import { StyleSheet, View } from 'react-native';

import { OrderDetail } from '@/components/order-detail';

export default function OrderDetailScreen() {
  return (
    <View style={styles.container}>
      <OrderDetail />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
});
