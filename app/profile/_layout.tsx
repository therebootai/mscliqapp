import { Stack } from 'expo-router';

export default function ProfileLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerTintColor: '#111827',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
        headerBackTitle: 'Back',
      }}
    >
      <Stack.Screen
        name="orders"
        options={{
          title: 'My Orders',
        }}
      />
      <Stack.Screen
        name="order/[id]"
        options={{
          title: 'Order Details',
        }}
      />
      <Stack.Screen
        name="reviews"
        options={{
          title: 'My Reviews',
        }}
      />
      <Stack.Screen
        name="review-form"
        options={{
          title: 'Write a Review',
        }}
      />
      <Stack.Screen
        name="edit"
        options={{
          title: 'Edit Profile',
        }}
      />
      <Stack.Screen
        name="addresses"
        options={{
          title: 'Saved Addresses',
        }}
      />
    </Stack>
  );
}
