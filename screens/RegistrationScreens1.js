import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Platform, Alert } from 'react-native';
import {Picker} from '@react-native-picker/picker';
//import * as Camera from 'expo-camera';
import { Camera } from 'expo-camera'; 
import { BarCodeScanner } from 'expo-barcode-scanner';
import * as Permissions from 'expo-permissions';
import firestore from '@react-native-firebase/firestore';
import { KeyboardAvoidingView } from 'react-native';
//import {db} from '../firebaseConfig'
//import firebase from '../firebaseConfig'
import db  from '../firebaseConfig'
import { collection, addDoc, getDocs, query, where } from 'firebase/firestore';

const constituencies = [
  'Select a constituency',
  'Shangri-la-Town',
  'Northern-Kunlun-Mountain',
  'Western-Shangri-la',
  'Naboo-Vallery',
  'New-Felucia',
];

const parties = ['Blue Party', 'Red Party', 'Yellow Party', 'Independent'];

const candidates = ['Candidate 1', 'Candidate 2', 'Candidate 3'];

const RegistrationScreen = ({ navigation }) => {
 //const db = firestore();

 //console.log("db",db);

  const [voterData, setVoterData] = useState({
    email: '',
    fullName: '',
    dateOfBirth: '',
    password: '',
    constituency: '',
    uvc: '',
  });
  const [errors, setErrors] = useState({});
  const [hasPermission, setHasPermission] = useState(null);
  const [scannedData, setScannedData] = useState(null);
  const [scanned, setScanned] = useState(null);
  const [buttonState, setButtonState] = useState(null);
  const [isFormValid, setIsFormValid] = useState(false);
  const barcodeScannerRef = useRef(null); // Reference to BarCodeScanner
  const [registrationSuccess, setRegistrationSuccess] = useState(false);

  /* useEffect(() => {
    const getPermission = async () => {
      const { status } = await Camera.getPermissionsAsync();
      setHasPermission(status === 'granted');
    };
    getPermission();
  }, []); */

  
  const handleRequestPermission = async () => {
    const { status } = await Permissions.askAsync(Permissions.CAMERA);
    /* if (status !== 'granted') {
      Alert.alert(
        'Camera Permission Required',
        'Please allow camera access to scan QR codes.',
        [{ text: 'OK' }],
        { cancelable: false }
      );
    } else {
      setHasPermission(true);
    } */
    setScanned(false)
    setHasPermission(status == "granted")
    setButtonState('clicked')
  };


  /* const handleRequestPermission = async () => {
    const { status } = await Camera.requestCameraPermissionsAsync();
    console.log("status");
    if (status !== 'granted') {
      Alert.alert(
        'Camera Permission Required',
        'Please allow camera access to scan QR codes.',
        [{ text: 'OK' }],
        { cancelable: false }
      );
    } else {
      setHasPermission(true);
    }
  }; */

  /* const handleRequestPermission = async () => {
    const { status } = await Camera.requestPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Camera Permission Required',
        'Please allow camera access to scan QR codes.',
        [{ text: 'OK' }],
        { cancelable: false }
      );
    } else {
      setHasPermission(true);
    }
  }; */

 /*  const handleChange = (field, value) => {
   // console.log(field);
    setVoterData({ ...voterData, [field]: value });
    setErrors({ ...errors, [field]: '' }); // Clear any previous errors
    validateFields(); // Trigger validation on change
  }; */

  const handleBarCodeScanned = ({ data }) => {
    setScannedData(data);
    //setHasPermission(false);
    handleChange('uvc', data);
    setScanned(true)
    //setHasPermission(status == "granted")
    setButtonState('normal')
  };
 
const showBarCode = (buttonState === "clicked" && hasPermission);

const handleRegister = async () => {
  try {
    const uvcRef = collection(db, 'ValidUVCs');
    const uvcQuery = await getDocs(uvcRef);

    const uvcList = [];
    uvcQuery.forEach((doc) => {
      uvcList.push(doc.data().uvc);
    });

    if (!uvcList.includes(voterData.uvc)) {
      setErrors({ ...errors, uvc: 'Invalid UVC code' });
      return; // Exit registration process if the entered UVC is invalid
    }

    const userRef = collection(db, 'users');
    const userQuery = await getDocs(query(userRef, where('email', '==', voterData.email)));

    if (!userQuery.empty) {
      setErrors({ ...errors, email: 'Email already registered' });
      return; // Exit registration process if the email is already registered
    }

    const { email, password, fullName, dateOfBirth, constituency, uvc } = voterData;

    const docRef = await addDoc(collection(db, 'users'), {
      email,
      fullName,
      password,
      dateOfBirth,
      constituency,
      uvc,
    });

    // On successful registration...
    // Show an alert when the user successfully registers
    Alert.alert('Registration Successful', 'Voter successfully registered!', [
      {
        text: 'OK',
        onPress: () => {
          setRegistrationSuccess(true);

          // Clear input fields after successful registration
          setVoterData({
            email: '',
            fullName: '',
            dateOfBirth: '',
            password: '',
            constituency: '',
            uvc: '',
          });
        },
      },
    ]);
    console.log('User registered with ID: ', docRef.id);
  } catch (error) {
    console.error('Error registering user:', error);
    // Handle error or display error message
  }
};

  // ... handleRegister function (same as before)
 /*  const handleRegister = async () => {
    try {
      const { email, password, fullName, dateOfBirth, constituency, uvc } = voterData;
  

      
      
      
 
        // Store user details in Firestore
      const docRef = await addDoc(collection(db, "users"), {
        email,
        fullName,
        password,
        dateOfBirth,
        constituency,
        uvc,
      });

      // On successful registration
    // Show an alert when the user successfully registers
    Alert.alert(
      'Registration Successful',
      'Voter successfully registered!',
      [
        {
          text: 'OK',
          onPress: () => {
            setRegistrationSuccess(true);

            // Clear input fields after successful registration
            setVoterData({
              email: '',
              fullName: '',
              dateOfBirth: '',
              password: '',
              constituency: '',
              uvc: '',
            });
          },
        },
      ]
    );
      console.log('User registered with ID: ', docRef.id);
  
        // Optionally, you can navigate to another screen after successful registration
        // navigation.navigate('NextScreen');
      
    } catch (error) {
      console.error('Error registering user:', error);
      // Handle error or display error message
    }
  };
   */

  const handleChange = (field, value) => {
    setVoterData({ ...voterData, [field]: value });
    validateField(field, value);
  };
  
  const validateField = (field, value) => {
    const updatedErrors = { ...errors };
  
    switch (field) {
      case 'email':
        if (!value || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          updatedErrors.email = 'Invalid email format';
        } else {
          delete updatedErrors.email;
        }
        break;
      
      case 'fullName':
        if (!value) {
          updatedErrors.fullName = 'Full name is required';
        } else {
          delete updatedErrors.fullName;
        }
        break;
  
      case 'dateOfBirth':
        if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
          updatedErrors.dateOfBirth = 'Invalid date format (YYYY-MM-DD)';
        } else {
          delete updatedErrors.dateOfBirth;
        }
        break;
  
      case 'password':
        if (!value || value.length < 6) {
          updatedErrors.password = 'Password must be at least 6 characters';
        } else {
          delete updatedErrors.password;
        }
        break;
  
      case 'constituency':
        if (!value || value === 'Select a constituency') {
          updatedErrors.constituency = 'Constituency is required';
        } else {
          delete updatedErrors.constituency;
        }
        break;
  
      case 'uvc':
        if (!value || (value.length !== 8 && value !== scannedData)) {
          updatedErrors.uvc = 'Invalid UVC format, should be 8 alphanumeric characters';
        } else {
          delete updatedErrors.uvc;
        }
        break;
  
      default:
        break;
    }
  
    setErrors(updatedErrors);
    setIsFormValid(Object.keys(updatedErrors).length === 0);
  };
  
  
 /*  
  const validateFields = () => {
    const errors = {};

    // Email validation
    if (!voterData.email) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(voterData.email)) {
      errors.email = 'Invalid email format';
    }

    // Full name validation
    if (!voterData.fullName) {
      errors.fullName = 'Full name is required';
    }

    // Date of birth validation
    if (!voterData.dateOfBirth) {
      errors.dateOfBirth = 'Date of birth is required';
    } else if (!/^\d{4}-\d{2}-\d{2}$/.test(voterData.dateOfBirth)) {
      errors.dateOfBirth = 'Invalid date format (YYYY-MM-DD)';
    }

    // Password validation
    if (!voterData.password) {
      errors.password = 'Password is required';
    } else if (voterData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }

    // Constituency validation
    if (!voterData.constituency) {
      errors.constituency = 'Constituency is required';
    }

   // UVC validation
   if (!voterData.uvc && !scannedData) {
    errors.uvc = 'UVC is required';
  } else if (!voterData.uvc && scannedData) {
    delete errors.uvc; // Clear the error if UVC is auto-filled via scannedData
  } else if (
    voterData.uvc &&
    !/^\d{8}$/.test(voterData.uvc) &&
    voterData.uvc !== scannedData // Avoid displaying an error when both values match
  ) {
    errors.uvc = 'Invalid UVC format, should be 8 digits';
  } else {
    delete errors.uvc; // Clear the error when the UVC field is manually filled and valid
  }
  setErrors(errors);
  setIsFormValid(Object.keys(errors).length === 0);
}; */

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
    
      <Text style={styles.title}>Voter Registration</Text>

      {/* Input fields with error handling */}
      {/* Input fields with error handling */}
      <TextInput
        style={styles.input}
        placeholder="Email"
        value={voterData.email}
        onChangeText={(value) => handleChange('email', value)}
      />
      {errors.email && <Text style={styles.error}>{errors.email}</Text>}

      <TextInput
        style={styles.input}
        placeholder="Full Name"
        value={voterData.fullName}
        onChangeText={(value) => handleChange('fullName', value)}
      />
      {errors.fullName && <Text style={styles.error}>{errors.fullName}</Text>}

      <TextInput
        style={styles.input}
        placeholder="Date of Birth (YYYY-MM-DD)"
        value={voterData.dateOfBirth}
        onChangeText={(value) => handleChange('dateOfBirth', value)}
      />
      {errors.dateOfBirth && <Text style={styles.error}>{errors.dateOfBirth}</Text>}

      <TextInput
        style={styles.input}
        placeholder="Password"
        secureTextEntry={true} // Hide password characters
        value={voterData.password}
        onChangeText={(value) => handleChange('password', value)}
      />
      {errors.password && <Text style={styles.error}>{errors.password}</Text>}
      
      
      

      {/* ... other input fields */}
      <Text>Constituency</Text>
      <Picker
        selectedValue={voterData.constituency}
        onValueChange={(value) => handleChange('constituency', value.toString())}
        style={styles.picker}
        placeholder="Select Constituency"
      >
       
        {constituencies.map((constituency) => (
          <Picker.Item key={constituency} label={constituency} value={constituency} />
        ))}
      </Picker>
      {errors.constituency && <Text style={styles.error}>{errors.constituency}</Text>}

      <Text style={styles.label}>UVC</Text>
      <View style={styles.uvcContainer}>
        <TextInput
          style={styles.input}
          placeholder="Enter UVC"
          value={voterData.uvc}
          onChangeText={(value) => handleChange('uvc', value)}
        />
         <Button title="Scan QR Code" onPress={handleRequestPermission} />
      </View>
      {errors.uvc && <Text style={styles.error}>{errors.uvc}</Text>}

      {/* {hasPermission && (
         <Camera
          style={StyleSheet.absoluteFillObject}
          onBarCodeScanned={handleBarCodeScanned}
          barCodeTypes={['qr']}
        />
      )} */}

      {showBarCode && 
      <BarCodeScanner 
        ref={barcodeScannerRef}
        onBarCodeScanned={scanned ? undefined : handleBarCodeScanned}
        style={StyleSheet.absoluteFillObject}
      />}
      
      {scannedData && <Text style={styles.centerText}>Scanned UVC: {scannedData}</Text>}


      
      {/* ... other input fields */}
      <View style={styles.buttonContainer}>
      <Button title="Register" style={styles.registerButton} 
       disabled={!isFormValid} // Disable button if validation fails
       onPress={() => {
        validateField(); // Ensure form is valid before submission
        if (isFormValid) {
          // Proceed with form submission
          handleRegister();
        }
      }} />
      </View>

      <Button
        title="Already a voter? Login"
        onPress={() => navigation.navigate('Login')}
      />
    </KeyboardAvoidingView>
  );
};

export default RegistrationScreen;

const styles = StyleSheet.create({
  // ... your styles for the component
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  input: {
    height: 40,
    paddingHorizontal: 10,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 5,
    marginBottom: 10,
  },
  error: {
    color: 'red',
    fontSize: 12,
    marginBottom: 5,
  },
  picker: {
    height: 40,
    padding: 10, // Increased padding for overlay
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 5,
  },
  button: {
    backgroundColor: '#007bff',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 5,
    color: '#fff',
    fontSize: 16,
  },
  uvcContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  centerText: {
    textAlign: 'center',
    fontSize: 16,
    margin: 10,
  },
  buttonContainer:{
    marginVertical: 10,
  }, 
  label:{
    marginTop: 10,
  },
});

const pickerSelectStyles = StyleSheet.create({
  inputIOS: {
    fontSize: 16,
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: 'gray',
    borderRadius: 4,
    color: 'black',
    paddingRight: 30, // to ensure the text is never behind the icon
  },
  inputAndroid: {
    fontSize: 16,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 0.5,
    borderColor: 'purple',
    borderRadius: 8,
    color: 'black',
    paddingRight: 30, // to ensure the text is never behind the icon
  },
});