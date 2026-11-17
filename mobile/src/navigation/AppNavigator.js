import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

import { theme } from '../config/theme';
import Header from '../components/Header';
import { useAuth } from '../context/AuthContext';

// Screens
import LeadFinderScreen from '../screens/LeadFinderScreen';
import SavedListsScreen from '../screens/SavedListsScreen';
import SavedListDetailScreen from '../screens/SavedListDetailScreen';
import CustomLeadsScreen from '../screens/CustomLeadsScreen';
import ProfileScreen from '../screens/ProfileScreen';
import AuthScreen from '../screens/AuthScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function MainTabNavigator({ navigation }) {
  return (
    <View style={styles.tabContainer}>
      <Header onProfilePress={() => navigation.navigate('Profile')} />
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarStyle: styles.tabBar,
          tabBarActiveTintColor: theme.colors.primary,
          tabBarInactiveTintColor: theme.colors.textMuted,
          tabBarLabelStyle: styles.tabLabel,
          tabBarIcon: ({ color, focused, size }) => {
            let iconName = 'ellipse-outline';
            if (route.name === 'Finder') {
              iconName = focused ? 'search' : 'search-outline';
            } else if (route.name === 'Lists') {
              iconName = focused ? 'bookmark' : 'bookmark-outline';
            } else if (route.name === 'Clusters') {
              iconName = focused ? 'folder' : 'folder-outline';
            } else if (route.name === 'Profile') {
              iconName = focused ? 'person' : 'person-outline';
            }
            return <Ionicons name={iconName} size={21} color={color} />;
          }
        })}
      >
        <Tab.Screen
          name="Finder"
          component={LeadFinderScreen}
          options={{ tabBarLabel: '10M+ Finder' }}
        />
        <Tab.Screen
          name="Lists"
          component={SavedListsScreen}
          options={{ tabBarLabel: 'Saved Lists' }}
        />
        <Tab.Screen
          name="Clusters"
          component={CustomLeadsScreen}
          options={{ tabBarLabel: 'Custom Clusters' }}
        />
        <Tab.Screen
          name="Profile"
          component={ProfileScreen}
          options={{ tabBarLabel: 'Account' }}
        />
      </Tab.Navigator>
    </View>
  );
}

export default function AppNavigator() {
  const { isLoggedIn } = useAuth();

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName={isLoggedIn ? 'MainTabs' : 'Auth'}
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: theme.colors.background }
        }}
      >
        <Stack.Screen
          name="Auth"
          component={AuthScreen}
          options={{
            animation: 'fade'
          }}
        />
        <Stack.Screen name="MainTabs" component={MainTabNavigator} />
        <Stack.Screen
          name="SavedListDetail"
          component={SavedListDetailScreen}
          options={{
            headerShown: false,
            animation: 'slide_from_right'
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  tabContainer: {
    flex: 1,
    backgroundColor: theme.colors.background
  },
  tabBar: {
    backgroundColor: theme.colors.surface,
    borderTopColor: theme.colors.border,
    borderTopWidth: 1,
    height: Platform.OS === 'ios' ? 84 : 64,
    paddingTop: 6,
    paddingBottom: Platform.OS === 'ios' ? 24 : 8
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '600'
  }
});
