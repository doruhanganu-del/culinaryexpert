import React from 'react';
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuth } from '../store/authContext';

import WelcomeScreen           from '../screens/onboarding/WelcomeScreen';
import UnitSelectionScreen     from '../screens/onboarding/UnitSelectionScreen';
import MedicalDisclaimerScreen from '../screens/onboarding/MedicalDisclaimerScreen';
import BiologicalDataScreen    from '../screens/onboarding/BiologicalDataScreen';
import MeasurementsScreen      from '../screens/onboarding/MeasurementsScreen';
import LifestyleScreen         from '../screens/onboarding/LifestyleScreen';
import HealthScoreScreen       from '../screens/onboarding/HealthScoreScreen';

import DashboardScreen from '../screens/dashboard/DashboardScreen';
import MealPlanScreen  from '../screens/mealplan/MealPlanScreen';
import SmartPrepScreen from '../screens/smartprep/SmartPrepScreen';
import GroceriesScreen from '../screens/groceries/GroceriesScreen';
import ProfileScreen   from '../screens/profile/ProfileScreen';

const Stack = createNativeStackNavigator();
const Tab   = createBottomTabNavigator();

const BRAND = '#1B4332';

type TabConfig = {
  filled: string;
  outline: string;
  labelKey: 'nav.today' | 'nav.mealPlan' | 'nav.prepHub' | 'nav.groceries' | 'nav.profile';
};

const TAB_CONFIG: Record<string, TabConfig> = {
  Dashboard: { filled: 'home',     outline: 'home-outline',     labelKey: 'nav.today'     },
  MealPlan:  { filled: 'calendar', outline: 'calendar-outline', labelKey: 'nav.mealPlan'  },
  SmartPrep: { filled: 'flame',    outline: 'flame-outline',    labelKey: 'nav.prepHub'   },
  Groceries: { filled: 'cart',     outline: 'cart-outline',     labelKey: 'nav.groceries' },
  Profile:   { filled: 'person',   outline: 'person-outline',   labelKey: 'nav.profile'   },
};

function CustomTabBar({ state, navigation }: BottomTabBarProps) {
  const { t }    = useTranslation();
  const insets   = useSafeAreaInsets();

  return (
    <View style={[styles.tabBar, { paddingBottom: Math.max(insets.bottom, 8) }]}>
      {state.routes.map((route, index) => {
        const focused = state.index === index;
        const cfg     = TAB_CONFIG[route.name];
        if (!cfg) return null;

        const label    = t(cfg.labelKey);
        const iconName = (focused ? cfg.filled : cfg.outline) as any;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });
          if (!focused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        return (
          <TouchableOpacity
            key={route.key}
            onPress={onPress}
            activeOpacity={0.75}
            style={styles.tabItem}
            accessibilityRole="button"
            accessibilityState={focused ? { selected: true } : {}}
            accessibilityLabel={label}
          >
            <View style={[styles.iconPill, focused && styles.iconPillActive]}>
              <Ionicons
                name={iconName}
                size={26}
                color={focused ? '#fff' : '#9CA3AF'}
              />
            </View>
            <Text
              style={[styles.tabLabel, focused && styles.tabLabelActive]}
              numberOfLines={2}
            >
              {label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="MealPlan"  component={MealPlanScreen}  />
      <Tab.Screen name="SmartPrep" component={SmartPrepScreen} />
      <Tab.Screen name="Groceries" component={GroceriesScreen} />
      <Tab.Screen name="Profile"   component={ProfileScreen}   />
    </Tab.Navigator>
  );
}

function OnboardingStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Welcome"           component={WelcomeScreen} />
      <Stack.Screen name="UnitSelection"     component={UnitSelectionScreen} />
      <Stack.Screen name="MedicalDisclaimer" component={MedicalDisclaimerScreen} />
      <Stack.Screen name="BiologicalData"    component={BiologicalDataScreen} />
      <Stack.Screen name="Measurements"      component={MeasurementsScreen} />
      <Stack.Screen name="Lifestyle"         component={LifestyleScreen} />
      <Stack.Screen name="HealthScore"       component={HealthScoreScreen} />
    </Stack.Navigator>
  );
}

export default function AppNavigator() {
  const { isOnboarded } = useAuth();

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!isOnboarded ? (
          <Stack.Screen name="Onboarding" component={OnboardingStack} />
        ) : null}
        <Stack.Screen name="Main" component={MainTabs} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    flexDirection:    'row',
    backgroundColor:  '#fff',
    paddingTop:       10,
    paddingHorizontal: 4,
    borderTopWidth:   1,
    borderTopColor:   '#F0F2F5',
    elevation:        20,
    shadowColor:      '#000',
    shadowOffset:     { width: 0, height: -4 },
    shadowOpacity:    0.09,
    shadowRadius:     16,
  },
  tabItem: {
    flex:           1,
    alignItems:     'center',
    justifyContent: 'center',
    paddingHorizontal: 2,
    gap:            4,
  },
  iconPill: {
    width:          56,
    height:         40,
    borderRadius:   20,
    alignItems:     'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  iconPillActive: {
    backgroundColor: BRAND,
    shadowColor:     BRAND,
    shadowOffset:    { width: 0, height: 4 },
    shadowOpacity:   0.35,
    shadowRadius:    10,
    elevation:       8,
  },
  tabLabel: {
    fontSize:    13,
    fontWeight:  '600',
    color:       '#9CA3AF',
    textAlign:   'center',
    lineHeight:  16,
    maxWidth:    72,
  },
  tabLabelActive: {
    color:      BRAND,
    fontWeight: '800',
  },
});
