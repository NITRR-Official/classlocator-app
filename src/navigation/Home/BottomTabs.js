import * as React from 'react';
import {
  View,
  StyleSheet,
  Text
} from 'react-native';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';
import {useEffect} from 'react';
import HomeScreen from '../../screens/Home/Home_Old.js';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import HomeIcon from '../../components/HomeIcon.js';
import ProfileIcon from '../../components/Profile.js';
import AboutMe from '../../screens/Profile/AboutMe.js';
import PingCard from '../../components/PingCard.js';
import {useAuth} from '../../utils/auth.js';
import PingCard2 from '../../components/PingCard2.js';
import {useNavigation} from '@react-navigation/native';
import {SafeAreaProvider, useSafeAreaInsets} from 'react-native-safe-area-context';


export default function BottomTabs(props) {
  const Tab = createBottomTabNavigator();
  const insets = useSafeAreaInsets();
  const {close, startServer, trackM} = useAuth();
  const {close2, closeAuth} = useAuth();
  const navigation = useNavigation();
  useEffect(() => {
    if (props.route.params != null && props.route.params != undefined) {
      startServer('maps').then(res => {
        trackM('Shared location');
        navigation.navigate('maps', {
          link: res,
          map_no: 3,
          parameters: props.route.params,
        });
      });
    }
  }, []);

  return (
    <SafeAreaProvider
      style={{
        width: wp(100),
        height: hp(104.1),
      }}>
      {close ? <PingCard /> : <></>}
      {close2 ? <PingCard2 /> : <></>}
      {closeAuth ? <Auth /> : <></>}

      <Tab.Navigator
        screenOptions={{
          contentStyle: {
            backgroundColor: 'red',
            // backgroundColor: "#FF0000",
          },
          headerShown: false,
          tabBarShowLabel: false,
          tabBarHideOnKeyboard: true,
          tabBarStyle: {
            position: 'absolute',
            bottom: 0,
            right: 0,
            left: 0,
            height: 65 + insets.bottom, // Adjust for gesture navigation
            paddingBottom: insets.bottom > 0 ? insets.bottom : 10,
            shadowOpacity: 1,
            shadowRadius: 16.0,
            elevation: 4,
            
            shadowColor: '#52006A',
        
            shadowOffset: {
              width: 0,
              height: 0,
            },
          },
        }}>
        <Tab.Screen
          name="Home_Tab"
          component={HomeScreen}
          options={{
            tabBarIcon: ({focused}) => {
              return (
                // <TouchableOpacity>
                <View
                  style={{
                    top:15,
                    width: wp(16),
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                  <HomeIcon color={focused ? '#01818C' : '#455A64'} />
                  <Text
                    style={{
                      fontFamily: 'Roboto',
                      fontWeight: '700',
                      fontSize: wp(3),
                      color: focused ? '#01818C' : '#455A64',
                    }}>
                    Home
                  </Text>
                </View>
                //  </TouchableOpacity>
              );
            },
          }}
        />

        <Tab.Screen
          name="Profile_Tab"
          component={AboutMe}
          options={{
            tabBarIcon: ({focused}) => {
              return (
                // <TouchableOpacity>
                <View
                  style={{
                    top:15,
                    width: wp(16),
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                  <ProfileIcon color={focused ? '#01818C' : '#455A64'} />
                  <Text
                    style={{
                      fontFamily: 'Roboto',
                      fontWeight: '700',
                      fontSize: wp(3),
                      color: focused ? '#01818C' : '#455A64',
                    }}>
                    About Us
                  </Text>
                </View>
                //  </TouchableOpacity>
              );
            },
          }}
        />

      </Tab.Navigator>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({});
