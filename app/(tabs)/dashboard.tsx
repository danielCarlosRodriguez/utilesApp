import { StyleSheet, View } from 'react-native';
import { Dashboard } from '@/components/dashboard';

export default function DashboardScreen() {
  return (
    <View style={styles.container}>
      <Dashboard />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
});
