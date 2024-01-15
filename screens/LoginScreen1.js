import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { collection, getDocs, query, where, addDoc, doc, setDoc } from 'firebase/firestore';
import db  from '../firebaseConfig'; // Import your Firestore instance here
import { KeyboardAvoidingView } from 'react-native';

import Button from '../components/Button'

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null); 
  const [userType, setUserType] = useState(''); // Initially no user type selected
 // const [officerEmail, setOfficerEmail] = useState(''); // Initially no user type selected

  const handleLogin = async () => {
   /*  try {
      const enteredEmail = email.trim(); // Trim any leading/trailing whitespace
      const enteredPassword = password;
  
      console.log("check",enteredEmail, enteredPassword )
      // Query the Firestore collection for the user with the matching email
      const usersRef = collection(db, 'users');
      const querySnapshot = await getDocs(query(usersRef, where('email', '==', enteredEmail)));
  
      if (!querySnapshot.empty) {
        // Iterate through the query results (there should be only one)
        querySnapshot.forEach((doc) => {
          const userData = doc.data();
          if (userData.email === enteredEmail && userData.password === enteredPassword) {
            console.log('Login successful');
            if(userType === "voter"){

              navigation.navigate('VoterDashboard', { user: userData });
            }else{
              navigation.navigate('ElectionDashboard');
            }
            // Reset email and password fields after successful login
            setEmail('');
            setPassword('');
          } else {
            console.log('Invalid email or password');
            setError('Invalid email or password');
          }
        });
      } else {
        console.log('User not found');
        setError('User not found');
      }
    } catch (error) {
      console.error('Error logging in:', error);
      setError('Error logging in');
    } */
    try {
      const enteredEmail = email.trim(); // Trim any leading/trailing whitespace
      const enteredPassword = password;
  
      let collectionName = '';

      if (userType === 'voter') {
        collectionName = 'users';
      } else {
        collectionName = 'officer';
      }

      console.log("check",enteredEmail, enteredPassword )
      // Query the Firestore collection for the user with the matching email
      const usersRef = collection(db, collectionName);
      const querySnapshot = await getDocs(query(usersRef, where('email', '==', enteredEmail)));
  
      if (!querySnapshot.empty) {
        // Iterate through the query results (there should be only one)
        querySnapshot.forEach((doc) => {
          const userData = doc.data();
          if (userData.email === enteredEmail && userData.password === enteredPassword) {
            console.log('Login successful');
            if(userType === "voter"){

              navigation.navigate('VoterDashboard', { user: userData });
            }else{
              navigation.navigate('ElectionDashboard');
            }
            // Reset email and password fields after successful login
            setEmail('');
            setPassword('');
          } else {
            console.log('Invalid email or password');
            setError('Invalid email or password');
          }
        });
      } else {
        console.log('User not found');
        setError('User not found');
      }
    } catch (error) {
      console.error('Error logging in:', error);
      setError('Error logging in');
    }
  };
  




  return (
    
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Text style={styles.title}>GEVS Login</Text>

        <View style={styles.mainContainer}>
        {userType === '' && ( // Show user type buttons initially
            <>
            <View style={styles.userTypeContainer}>
                <Button
                    title="Voter Login"
                    onPress={() => setUserType('voter')}
                    //style={styles.userTypeButton}
                />
            </View>
            <View style={styles.userTypeContainer}>
                <Button
                    title="Election Commission Officer Login"
                    onPress={() => setUserType('officer')}
                   // style={styles.userTypeButton}
                />
            </View>
            </>
        )}
        
        </View>

      {userType === 'voter' && ( // Show voter login form
        <View>
          <Text style={styles.title}>Voters Login</Text>
          <TextInput
            style={styles.input}
            placeholder="Voter ID (Email)"
            value={email}
            onChangeText={(value) => setEmail(value)}
          />
         

          <TextInput
            style={styles.input}
            placeholder="Password"
            secureTextEntry={true}
            value={password}
            onChangeText={(value) => setPassword(value)}
          />
          {error && <Text style={styles.error}>{error}</Text>}
          <Button title="Login" onPress={handleLogin} />
          <TouchableOpacity onPress={() => setUserType('')} style={styles.backLink}>
            <Text>Go back to user selection</Text>
          </TouchableOpacity>
        </View>
      )}



   {/* Similar conditional rendering for Election Commission Officer form */}

      {userType === 'officer' && (
        <View>
            <Text style={styles.title}>Election Officer Login</Text>
            <TextInput
            style={styles.input}
            placeholder="Officer ID"
            value={email}
            onChangeText={(value) => setEmail(value)}
            />
          
            <TextInput
            style={styles.input}
            placeholder="Password"
            secureTextEntry={true}
            value={password}
            onChangeText={(value) => setPassword(value)}
            />
           
            {error && <Text style={styles.error}>{error}</Text>}
            <Button title="Login" onPress={handleLogin} />
            <TouchableOpacity onPress={() => setUserType('')} style={styles.backLink}>
            <Text style={styles.link}>Go back to user selection</Text>
            </TouchableOpacity>
        </View>
      )}

      <TouchableOpacity onPress={() => navigation.navigate('Registration')}>
        <Text>Not registered yet? Register Now</Text>
      </TouchableOpacity>
    </KeyboardAvoidingView>

  );

}

// ... styles
const styles = StyleSheet.create({
    // ... your styles for the component
    container: {
      flex: 1,
      padding: 20,
      backgroundColor: '#fff',
    },
    mainContainer:{
        marginTop: '20%'
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
    userTypeContainer:{
        marginVertical: 10,
    },
    backLink:{
        marginVertical: 10,
    },
    

  });

export default LoginScreen;
