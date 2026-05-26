import React from 'react';
import { TouchableOpacity, View, Text, StyleSheet, Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuth } from '../store/authContext';
import LanguageFAB from '../components/LanguageFAB';

import WelcomeScreen           from '../screens/onboarding/WelcomeScreen';
import UnitSelectionScreen     from '../screens/onboarding/UnitSelectionScreen';
import MedicalDisclaimerScreen from '../screens/onboarding/MedicalDisclaimerScreen';
import BiologicalDataScreen    from '../screens/onboarding/BiologicalDataScreen';
import MeasurementsScreen      from '../screens/onboarding/MeasurementsScreen';
import LifestyleScreen         from '../screens/onboarding/LifestyleScreen';
import HealthScoreScreen       from '../screens/onboarding/HealthScoreScreen';
import AccountCreationScreen   from '../screens/onboarding/AccountCreationScreen';
import LoginScreen             from '../screens/onboarding/LoginScreen';

import DashboardScreen from '../screens/dashboard/DashboardScreen';
import MealPlanScreen  from '../screens/mealplan/MealPlanScreen';
import GroceriesScreen from '../screens/groceries/GroceriesScreen';
import ProfileScreen   from '../screens/profile/ProfileScreen';

const Stack = createNativeStackNavigator();
const Tab   = createBottomTabNavigator();

const BRAND = '#1B4332';

type TabConfig = {
  labelKey: 'nav.today' | 'nav.mealPlan' | 'nav.groceries' | 'nav.profile';
};

const TAB_CONFIG: Record<string, TabConfig> = {
  Dashboard: { labelKey: 'nav.today'     },
  MealPlan:  { labelKey: 'nav.mealPlan'  },
  Groceries: { labelKey: 'nav.groceries' },
  Profile:   { labelKey: 'nav.profile'   },
};

function CustomTabBar({ state, navigation }: BottomTabBarProps) {
  const { t }  = useTranslation();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.tabBar, { paddingBottom: Math.max(insets.bottom, 8) }]}>
      {state.routes.map((route, index) => {
        const focused = state.index === index;
        const cfg     = TAB_CONFIG[route.name];
        if (!cfg) return null;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });
          if (!focused && !event.defaultPrevented) navigation.navigate(route.name);
        };

        return (
          <TouchableOpacity
            key={route.key}
            onPress={onPress}
            activeOpacity={0.75}
            style={styles.tabItem}
            accessibilityRole="button"
            accessibilityState={focused ? { selected: true } : {}}
            accessibilityLabel={t(cfg.labelKey)}
          >
            <Text style={[styles.tabLabel, focused && styles.tabLabelActive]} numberOfLines={2}>
              {t(cfg.labelKey)}
            </Text>
            {focused && <View style={styles.activeIndicator} />}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function MainTabs() {
  return (
    <View style={{ flex: 1 }}>
      <Tab.Navigator
        tabBar={(props) => <CustomTabBar {...props} />}
        screenOptions={{ headerShown: false }}
      >
        <Tab.Screen name="Dashboard" component={DashboardScreen} />
        <Tab.Screen name="MealPlan"  component={MealPlanScreen}  />
        <Tab.Screen name="Groceries" component={GroceriesScreen} />
        <Tab.Screen name="Profile"   component={ProfileScreen}   />
      </Tab.Navigator>
      <LanguageFAB />
    </View>
  );
}

function OnboardingStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, statusBarColor: '#fff', statusBarStyle: 'dark' }}>
      <Stack.Screen name="Welcome"           component={WelcomeScreen} />
      <Stack.Screen name="UnitSelection"     component={UnitSelectionScreen} />
      <Stack.Screen name="MedicalDisclaimer" component={MedicalDisclaimerScreen} />
      <Stack.Screen name="BiologicalData"    component={BiologicalDataScreen} />
      <Stack.Screen name="Measurements"      component={MeasurementsScreen} />
      <Stack.Screen name="Lifestyle"         component={LifestyleScreen} />
      <Stack.Screen name="HealthScore"       component={HealthScoreScreen} />
      <Stack.Screen name="AccountCreation"   component={AccountCreationScreen} />
      <Stack.Screen name="Login"             component={LoginScreen} />
    </Stack.Navigator>
  );
}

export default function AppNavigator() {
  const { isOnboarded } = useAuth();

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isOnboarded ? (
          <Stack.Screen name="Main" component={MainTabs} />
        ) : (
          <Stack.Screen name="Onboarding" component={OnboardingStack} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    flexDirection:     'row',
    backgroundColor:   '#fff',
    paddingTop:        8,
    paddingHorizontal: 4,
    borderTopWidth:    1,
    borderTopColor:    '#F0F2F5',
    elevation:         20,
    shadowColor:       '#000',
    shadowOffset:      { width: 0, height: -4 },
    shadowOpacity:     0.06,
    shadowRadius:      12,
  },
  tabItem: {
    flex:           1,
    alignItems:     'center',
    justifyContent: 'center',
    paddingHorizontal: 2,
    paddingBottom:  4,
    gap:            3,
    minHeight:      44,
  },
  tabLabel: {
    fontSize:   12,
    fontWeight: '600',
    color:      '#9CA3AF',
    textAlign:  'center',
    lineHeight: 16,
  },
  tabLabelActive: {
    color:      BRAND,
    fontWeight: '800',
    fontSize:   13,
  },
  activeIndicator: {
    width:           24,
    height:          3,
    borderRadius:    2,
    backgroundColor: BRAND,
  },
});
