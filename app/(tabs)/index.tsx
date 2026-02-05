import { StyleSheet, View } from 'react-native';

import { OrderList } from '@/components/order-list';

export default function HomeScreen() {
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
