import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSelector } from 'react-redux';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import colors from '../colors/colors';
import { ICONS } from '../constants/icons';

import Home from '../screens/Home';
import Settings from '../screens/Settings';

const Tab = createBottomTabNavigator();

export default function TabNavigator({ onLogout }) {
    const isDark = useSelector((state) => state.theme.isDark);
    const theme = isDark ? colors.dark : colors.light;

    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                headerShown: false,
                headerStyle: {
                    backgroundColor: theme.surface,
                    elevation: 0,
                    shadowOpacity: 0,
                    borderBottomWidth: 1,
                    borderBottomColor: theme.border,
                },
                headerTitleStyle: {
                    color: theme.text,
                    fontWeight: "bold",
                },
                headerTintColor: theme.text,
                tabBarShowLabel: true,
                tabBarActiveTintColor: theme.primary,
                tabBarInactiveTintColor: theme.textLight,
                tabBarStyle: {
                    backgroundColor: theme.surface,
                    borderTopColor: theme.border,
                    elevation: 5,
                },
                tabBarLabelStyle: {
                    fontSize: 12,
                    fontWeight: "600",
                },
                tabBarIcon: ({ focused, color, size }) => {
                    let iconName;

                    if (route.name === 'Home') {
                        iconName = focused ? ICONS.TAB_HOME : ICONS.TAB_HOME_OUTLINE;
                    } else if (route.name === 'Settings') {
                        iconName = focused ? ICONS.TAB_SETTINGS : ICONS.TAB_SETTINGS_OUTLINE;
                    }

                    return <MaterialCommunityIcons name={iconName} size={size} color={color} />;
                },
            })}
        >
            <Tab.Screen name='Home'>
                {(props) => <Home {...props} onLogout={onLogout} />}
            </Tab.Screen>
            <Tab.Screen name='Settings'>
                {(props) => <Settings {...props} onLogout={onLogout} />}
            </Tab.Screen>
        </Tab.Navigator>
    );
}
