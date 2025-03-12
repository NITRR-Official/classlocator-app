import React, {useState, useEffect} from 'react';
import {
  StyleSheet,
  Text,
  View,
  Image,
  TextInput,
  TouchableOpacity,
  ToastAndroid,
} from 'react-native';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';
import {theme} from '../theme';
import {useAuth} from '../utils/auth';
import axios from 'axios';

const B = props => <Text style={{fontWeight: '500'}}>{props.children}</Text>;

const Authentication = async (roll, password, cpass, name, dept) => {
  const result = await axios.get('https://classlocator-latest.onrender.com/admin/login',{
    rollno: roll,
    password: password,
  })
  .then((res) => {
    //A token will be generated and stored in the local storage
    console.log(res.data);

    //If new user is founded then registration will be done
    // registration(roll, password, cpass, name, dept);
    return true;
  }).catch((err)=>{
    console.log(err);
    return false;
  });

  console.log("From authentication section: ",result);

  return result;
};

const registration = async (roll, password, cpass, name, dept) => {
  if (cpass !== password) {
    console.log("Password doesn't match");
    return false;
  }

  const result = await axios
    .post('http://localhost:8080/admin/signup', {
      rollno: roll,
      password: password,
      name: name,
      department: dept,
    })
    .then(res => {
      //A token will be generated and stored in the local storage
      console.log(res.data);
      return true;
    })
    .catch(err => {
      console.log(err);
      return false;
    });

  console.log(result);
};

function Auth() {
  const {closeAuthNow, closeAuth} = useAuth();
  const [roll, setRoll] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [department, setDepartment] = useState('');
  const [rollError, setRollError] = useState('Please enter a number with exactly 7 to 9 digits.');
  const [passError, setPassError] = useState('Please add an upper or lower characters including a number and a special character.');

  const validateInput = () => {
    const regex = /^\d{7,9}$/;
    if (!regex.test(roll)) {
      setRollError('Please enter a number with exactly 7 to 9 digits.');
      return false;
    }
    setRollError(''); // Clear error if input is valid
    return true;
  };

  const validatePassword = () => {
    const regex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/;

    if (!regex.test(password)) {
      setPassError(
        'Please add an upper or lower characters including a number and a special character.',
      );
      return false;
    }

    setPassError(''); // Clear error if password is valid
    return true;
  };

  return (
    <View
      style={{
        width: wp(100),
        height: hp(104.2),
        position: 'absolute',
        zIndex: 5,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(256, 256, 256, 0.5)',
        display: closeAuth ? 'flex' : 'none',
      }}>
      <View
        style={{
          paddingVertical: hp(3.5),
          height: hp(80),
          width: wp(95),
          backgroundColor: '#fff',
          marginTop: hp(0),
          borderRadius: wp(8),
          paddingHorizontal: wp(4),
          alignItems: 'center',
          borderWidth: hp(0.1),
          justifyContent: 'space-between',
        }}>
        <Text
          style={{
            fontSize: wp(5.4),
            fontWeight: '500',
            textAlign: 'center',
            color: '#455A64',
          }}>
          Welcome to Classlocator
        </Text>
        {/* <HomePing width={wp(22.66)} height={wp(20.32)} /> */}
        <View
          style={{
            height: hp(38),
            width: wp(85),
            justifyContent: 'space-between',
          }}>
          <View>
            <Text style={{fontSize: wp(4.2), color: 'black'}}>
              <B>Roll number</B>
            </Text>
            <TextInput
              value={roll}
              maxLength={9}
              keyboardType="numeric"
              onChangeText={setRoll}
              placeholder="Eg. 21116028"
              placeholderTextColor='gray'
              style={{borderWidth: 1, width: wp(80), height: hp(6)}}
            />
          </View>
          <View>
            <Text style={{fontSize: wp(4.2), color: 'black'}}>
              <B>Password</B>
            </Text>
            <TextInput
              value={password}
              secureTextEntry={true}
              onChangeText={setPassword}
              placeholder="Eg. Something fancy"
              placeholderTextColor='gray'
              style={{
                borderWidth: 1,
                color: 'black',
                width: wp(80),
                height: hp(6),
              }}
            />
          </View>
          <View>
            <Text style={{fontSize: wp(4.2), color: 'black'}}>
              <B>Confirm Password</B>
            </Text>
            <TextInput
              value={confirmPassword}
              secureTextEntry={true}
              onChangeText={setConfirmPassword}
              placeholder="Same fancy here"
              placeholderTextColor='gray'
              style={{
                borderWidth: 1,
                color: 'black',
                width: wp(80),
                height: hp(6),
              }}
            />
          </View>
          <View>
            <Text style={{fontSize: wp(4.2), color: 'black'}}>
              <B>Name</B>
            </Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Your beautiful name"
              placeholderTextColor='gray'
              style={{borderWidth: 1, width: wp(80), height: hp(6)}}
            />
          </View>

          {/* For testing purpose it is department is textfield later it will be replaced by dropdown */}
          <View>
            <Text style={{fontSize: wp(4.2), color: 'black'}}>
              <B>Department</B>
            </Text>
            <TextInput
              value={department}
              onChangeText={setDepartment}
              placeholder="Where are you stucked"
              placeholderTextColor='gray'
              style={{borderWidth: 1, width: wp(80), height: hp(6)}}
            />
          </View>
        </View>

        <TouchableOpacity
          activeOpacity={0.8}
          style={[
            {
              backgroundColor: theme.maincolor,
              width: wp(34),
              height: hp(6),
              borderRadius: wp(4),
              justifyContent: 'center',
              alignItems: 'center',
              flexDirection: 'row',
            },
          ]}
          onPress={async () => {
            if (validateInput() && validatePassword()) {
              const res = await Authentication(roll, password, confirmPassword, name, department)
              if (res) {
                closeAuthNow(false);
              }
            } else {
              if (!validateInput()) {
                ToastAndroid.show(rollError, ToastAndroid.SHORT);
              }

              if (!validatePassword()) {
                ToastAndroid.show(passError, ToastAndroid.LONG);
              }
            }
          }}>
          <Text style={[{color: '#fff', fontSize: wp(5)}]}>Welcome</Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.8}
          style={[
            {
              backgroundColor: theme.maincolor,
              width: wp(34),
              height: hp(6),
              borderRadius: wp(4),
              justifyContent: 'center',
              alignItems: 'center',
              flexDirection: 'row',
            },
          ]}
          onPress={() => {
            closeAuthNow(false);
          }}>
          <Text style={[{color: '#fff', fontSize: wp(5)}]}>Close</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default Auth;
