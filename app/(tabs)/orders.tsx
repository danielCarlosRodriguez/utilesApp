import { StyleSheet, View } from 'react-native';

import { OrderList } from '@/components/order-list';

export default function OrdersScreen() {
  return (
    <View style={styles.container}>
      <OrderList />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
});
