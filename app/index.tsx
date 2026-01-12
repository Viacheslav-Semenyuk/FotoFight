import { Redirect } from 'expo-router';

export default function Index() {
  // Feed is public, so redirect everyone there
  return <Redirect href="/(tabs)/feed" />;
}
