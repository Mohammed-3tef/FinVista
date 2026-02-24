import React, { useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Text, View, BackHandler, Platform } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { COLORS, SPACING } from '../constants/theme';
import ConfirmModal from '../components/ConfirmModal';

import DashboardScreen from '../screens/DashboardScreen';
import GoalsScreen from '../screens/GoalsScreen';
import GoalDetailScreen from '../screens/GoalDetailScreen';
import GoalFormScreen from '../screens/GoalFormScreen';
import AnalyticsScreen from '../screens/AnalyticsScreen';
import SmsTransactionsScreen from '../screens/SmsTransactionsScreen';
import SettingsScreen from '../screens/SettingsScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function TabIcon({ emoji, focused }: { emoji: string; focused: boolean }) {
  return (
    <View style={{ alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ fontSize: focused ? 22 : 20, opacity: focused ? 1 : 0.6 }}>{emoji}</Text>
    </View>
  );
}

function TabNavigator() {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const [exitModalVisible, setExitModalVisible] = useState(false);

  // Intercept Android hardware back button when tabs are focused
  useFocusEffect(
    React.useCallback(() => {
      const onBackPress = () => {
        setExitModalVisible(true);
        return true; // Prevent default back behavior
      };

      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => subscription.remove();
    }, []),
  );

  return (
    <>
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: theme.tabBar,
            borderTopColor: theme.cardBorder,
            borderTopWidth: 1,
            paddingBottom: 6,
            paddingTop: 6,
            height: 80,
          },
          tabBarActiveTintColor: COLORS.accent,
          tabBarInactiveTintColor: theme.textMuted,
          tabBarLabelStyle: { fontSize: 10, fontWeight: '600', marginTop: 2 },
        }}>
        <Tab.Screen
          name="Dashboard"
          component={DashboardScreen}
          options={{
            title: t.dashboard,
            tabBarIcon: ({ focused }) => <TabIcon emoji="🏠" focused={focused} />,
          }}
        />
        <Tab.Screen
          name="Goals"
          component={GoalsScreen}
          options={{
            title: t.goals,
            tabBarIcon: ({ focused }) => <TabIcon emoji="🎯" focused={focused} />,
          }}
        />
        <Tab.Screen
          name="Analytics"
          component={AnalyticsScreen}
          options={{
            title: t.analytics,
            tabBarIcon: ({ focused }) => <TabIcon emoji="📊" focused={focused} />,
          }}
        />
        <Tab.Screen
          name="Transactions"
          component={SmsTransactionsScreen}
          options={{
            title: 'SMS',
            tabBarIcon: ({ focused }) => <TabIcon emoji="📩" focused={focused} />,
          }}
        />
        <Tab.Screen
          name="Settings"
          component={SettingsScreen}
          options={{
            title: t.settings,
            tabBarIcon: ({ focused }) => <TabIcon emoji="⚙️" focused={focused} />,
          }}
        />
      </Tab.Navigator>

      <ConfirmModal
        visible={exitModalVisible}
        title="Exit App"
        message="Are you sure you want to exit FinVista?"
        confirmLabel="Exit"
        cancelLabel="Stay"
        danger={false}
        onConfirm={() => BackHandler.exitApp()}
        onCancel={() => setExitModalVisible(false)}
      />
    </>
  );
}

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Tabs" component={TabNavigator} />
        <Stack.Screen
          name="GoalDetail"
          component={GoalDetailScreen}
          options={{ presentation: 'card' }}
        />
        <Stack.Screen
          name="GoalForm"
          component={GoalFormScreen}
          options={{ presentation: 'modal' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}