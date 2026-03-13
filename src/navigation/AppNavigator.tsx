import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { BackHandler } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { COLORS } from '../constants/theme';
import ConfirmModal from '../components/ConfirmModal';

import DashboardScreen from '../screens/DashboardScreen';
import GoalsScreen from '../screens/GoalsScreen';
import GoalDetailScreen from '../screens/GoalDetailScreen';
import GoalFormScreen from '../screens/GoalFormScreen';
import RecentActivityScreen from '../screens/RecentActivityScreen';
import AnalyticsScreen from '../screens/AnalyticsScreen';
import SmsTransactionsScreen from '../screens/SmsTransactionsScreen';
import SettingsScreen from '../screens/SettingsScreen';
import OnboardingScreen from '../screens/OnboardingScreen';
import ProfileScreen from '../screens/ProfileScreen';
import AchievementsScreen from '../screens/AchievementsScreen';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { resolveIcon } from '../constants/icons';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function TabNavigator() {
  const { theme } = useTheme();
  const { t, isRTL } = useLanguage();
  const { lock } = useAuth();
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
            tabBarIcon: ({ focused }) => <FontAwesomeIcon icon={resolveIcon('faHouse')} size={focused ? 22 : 20} color={focused ? COLORS.accent : theme.textMuted} />  ,
          }}
        />
        <Tab.Screen
          name="Goals"
          component={GoalsScreen}
          options={{
            title: t.goals,
            tabBarIcon: ({ focused }) => <FontAwesomeIcon icon={resolveIcon('faBullseye')} size={focused ? 22 : 20} color={focused ? COLORS.accent : theme.textMuted} />  ,
          }}
        />
        <Tab.Screen
          name="Analytics"
          component={AnalyticsScreen}
          options={{
            title: t.analytics,
            tabBarIcon: ({ focused }) => <FontAwesomeIcon icon={resolveIcon('faChartLine')} size={focused ? 22 : 20} color={focused ? COLORS.accent : theme.textMuted} />  ,
          }}
        />
        <Tab.Screen
          name="Transactions"
          component={SmsTransactionsScreen}
          options={{
            title: isRTL ? 'رسائل SMS' : 'SMS',
            tabBarIcon: ({ focused }) => <FontAwesomeIcon icon={resolveIcon('faEnvelope')} size={focused ? 22 : 20} color={focused ? COLORS.accent : theme.textMuted} />  ,
          }}
        />
        <Tab.Screen
          name="Settings"
          component={SettingsScreen}
          options={{
            title: t.settings,
            tabBarIcon: ({ focused }) => <FontAwesomeIcon icon={resolveIcon('faCog')} size={focused ? 22 : 20} color={focused ? COLORS.accent : theme.textMuted} />  ,
          }}
        />
      </Tab.Navigator>

      <ConfirmModal
        visible={exitModalVisible}
        title={isRTL ? 'خروج من التطبيق' : 'Exit App'}
        message={isRTL ? `هل أنت متأكد أنك تريد الخروج من ${t.appName}؟` : `Are you sure you want to exit ${t.appName}?`}
        confirmLabel={isRTL ? 'خروج' : 'Exit'}
        cancelLabel={isRTL ? 'البقاء' : 'Stay'}
        danger={false}
        onConfirm={() => { setExitModalVisible(false); lock(); BackHandler.exitApp(); }}
        onCancel={() => setExitModalVisible(false)}
      />
    </>
  );
}

export default function AppNavigator() {
  const [initialRoute, setInitialRoute] = useState<'Onboarding' | 'MainTabs' | null>(null);

  useEffect(() => {
    AsyncStorage.getItem('hasSeenOnboarding').then(val => {
      setInitialRoute(val === 'true' ? 'MainTabs' : 'Onboarding');
    });
  }, []);

  // Show nothing (blank dark screen) while determining initial route
  if (!initialRoute) return null;

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName={initialRoute} screenOptions={{ headerShown: false }}>
        <Stack.Screen
          name="Onboarding"
          component={OnboardingScreen}
          options={{ animation: 'fade' }}
        />
        <Stack.Screen
          name="MainTabs"
          component={TabNavigator}
          options={{ animation: 'fade' }}
        />
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
        <Stack.Screen
          name="RecentActivity"
          component={RecentActivityScreen}
          options={{ presentation: 'card' }}
        />
        <Stack.Screen
          name="Profile"
          component={ProfileScreen}
          options={{ presentation: 'card' }}
        />
        <Stack.Screen
          name="Achievements"
          component={AchievementsScreen}
          options={{ presentation: 'card' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}