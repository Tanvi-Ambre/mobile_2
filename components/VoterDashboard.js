import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
//import { getFirestore, collection, doc, updateDoc, getDocs, getDoc, query, where, setDoc } from 'firebase/firestore';
//import db from "../firebaseConfig";

import Button from '../components/Button'

const baseUri = 'http://10.28.135.157:3000'
const VoterDashboard = ({ voterId, navigation, route }) => {
  const [candidates, setCandidates] = useState([]);
  const [hasVoted, setHasVoted] = useState(false);
  const [electionStatus, setElectionStatus] = useState('Pending');
  const [votedParty, setVotedParty] = useState(null);
  const [announceOutcome, setAnnounceOutcome] = useState('');
  const [resultsAnnounced, setResultsAnnounced] = useState(false);

  const { user } = route.params;
  const constituencyName = user.constituency;
  const email = user.email;

  useEffect(() => {
    const fetchCandidates = async () => {
      try {
        const apiUrl = `${baseUri}/gevs/constituency/${constituencyName}`;
        const response = await axios.get(apiUrl);
        if (response.data && response.data.result) {
          setCandidates(response.data.result);
        }
      } catch (error) {
        console.error('Error fetching candidates:', error);
      }
    };
    fetchCandidates();

    const fetchElectionStatus = async () => {
      try {
        const electionRef = doc(db, 'election', 'hJ05mQy9V3HHWlm4gamB'); 
        const electionDoc = await getDoc(electionRef);
  
        if (electionDoc.exists()) {
          console.log("Hi", electionDoc.data().electionStatus)
          //console.log("partname", electionDoc.data().votedParty || null)
          //setVotedParty(electionDoc.data().votedParty || null);
          setElectionStatus(electionDoc.data().electionStatus);
        } else {
          console.error('Election document not found');
        }
      } catch (error) {
        console.error('Error fetching election status:', error);
      }
    };
    fetchElectionStatus();

    const fetchVotingStatus = async () => {
      try {
        //console.log("status")
        const userRef = collection(db, 'users'); 
        const userSnapshot = await getDocs(query(userRef, where('email', '==', email)));
       // const userSnapshot = await getDocs(userQuery);

         if (!userSnapshot.empty) {
          // Assuming there is only one user with a given email
          const userDoc = userSnapshot.docs[0];
          console.log("userDoc.data().hasVoted", userDoc.data().hasVoted)
          setHasVoted(userDoc.data().hasVoted || false);
        } else {
          console.error('User not found');
        }
      } catch (error) {
        console.error('Error fetching voting status:', error);
      }
    };
    fetchVotingStatus();

    const fetchAnnouncementStatus = async () => {
      try {
        const electionRef = doc(db, 'election', 'hJ05mQy9V3HHWlm4gamB');
        const electionDoc = await getDoc(electionRef);

        if (electionDoc.exists()) {
          setAnnounceOutcome(electionDoc.data().electionOutcome || '');
          setResultsAnnounced(electionDoc.data().resultsAnnounced || false);
        } else {
          console.error('Election document not found');
        }
      } catch (error) {
        console.error('Error fetching announcement status:', error);
      }
    };
    fetchAnnouncementStatus();
  }, [route.params]);

  /* useEffect(() => {
    const retrieveVoterId = async () => {
      try {
        const lastVoterId = await AsyncStorage.getItem('lastVoterId');
        if (lastVoterId) {
          console.log('Last Voter ID:', lastVoterId);
          // Do something with the last Voter ID if needed
        }
      } catch (error) {
        console.error('Error retrieving last Voter ID:', error);
      }
    };

    retrieveVoterId();
  }, []);
 */
// console.log("constituencyName",constituencyName)
// console.log("email",email)
  /* const voteForCandidate = async (candidateName) => {
    try {
      if (hasVoted) {
        console.log('You have already voted.');
        return;
      }

      const candidateRef = doc(db, 'constituencies', constituencyName, 'candidates', candidateName);
      await updateDoc(candidateRef, { voteCount: candidates.find(candidate => candidate.name === candidateName).voteCount + 1 });

      const updatedCandidates = candidates.map(candidate => {
        if (candidate.name === candidateName) {
          return { ...candidate, voteCount: candidate.voteCount + 1 };
        }
        return candidate;
      });

      const apiUrl = `http://10.28.135.157:3000/gevs/constituency/${constituencyName}`;
      await axios.put(apiUrl, { result: updatedCandidates });

      await AsyncStorage.setItem(`VOTING_STATUS_${voterId}`, 'VOTED');
      setHasVoted(true);
      console.log('Vote cast successfully!');
    } catch (error) {
      console.error('Error voting:', error);
    }
  }; */

  const storeVoterId = async (voterId) => {
    try {
      await AsyncStorage.setItem('lastVoterId', voterId);
      console.log('Voter ID stored:', voterId);
    } catch (error) {
      console.error('Error storing Voter ID:', error);
    }
  };

  console.log("electionStatus", electionStatus)
  console.log("votedParty", votedParty)

  const voteForCandidate = async (partyName, candidateName) => {
    console.log("partyName",partyName, email )
    try {
      if (electionStatus !== 'ongoing') {
        console.log('Election not yet started or already ended.');
        return;
      }

      const constituencyRef = doc(db, 'constituencies', constituencyName);
      const usersRef = collection(db, 'users');
      const userQuery = query(usersRef, where('email', '==', email));

      // Check if the user has already voted
      const userSnapshot = await getDocs(userQuery);
      if (!userSnapshot.empty && userSnapshot.docs[0].data().hasVoted) {
        console.log('You have already voted.');
        return;
      }

      console.log("Not voted")

      if (!userSnapshot.empty) {
        const userDoc = userSnapshot.docs[0];
        const userRef = doc(db, 'users', userDoc.id); 
        await setDoc(userRef, { hasVoted: true, votedParty: partyName }, { merge: true });
      }

      const candidates = (await getDoc(constituencyRef)).data().candidates;
      const updatedCandidates = candidates.map(candidate => {
        console.log("candidate", candidate === candidateName)
        if (candidate.name  === candidateName) {
          console.log("match")
          return { ...candidate, voteCount: candidate.voteCount + 1 };
        }
        return candidate;
      });

      // Update candidates in Firestore
      await updateDoc(constituencyRef, { candidates: updatedCandidates });

      // Set the hasVoted status in Firestore for the user
      if (!userSnapshot.empty) {
        const userDoc = userSnapshot.docs[0];
        await setDoc(userDoc.ref, { hasVoted: true }, { merge: true });
      }
console.log("party Name",partyName )

      setHasVoted(true);
      setVotedParty(partyName);
      //await storeVoterId(voterId);
      console.log('Vote cast successfully!');
    } catch (error) {
      console.error('Error voting:', error);
    }
  };
  
  
  return (
    <View style={styles.container}>
       <Text style={styles.title}>
        {electionStatus === 'ongoing' && `Welcome, ${user.fullName}!`}
        {electionStatus !== 'ongoing' && 'Election not yet started'}
      </Text>
     {/*  <Text style={styles.title}>Welcome, {user.fullName}!</Text> */}
     {resultsAnnounced && (
        <Text style={styles.outcome}>{announceOutcome}</Text>
      )} 

     {electionStatus === 'ongoing' && !hasVoted && (
        <>
        <Text style={styles.subtitle}>Selected Constituency: {user.constituency}</Text>
      <Text style={styles.subtitle}>Candidates:</Text>
      <FlatList
        data={candidates}
        keyExtractor={(item) => item.name}
        renderItem={({ item }) => {
          console.log("item", item)
          return(
            <View style={styles.candidateContainer}>
            <Text style={styles.text}>Name: {item.name}</Text>
            <Text style={styles.text}>Party: {item.party}</Text>
            {hasVoted ? (
              <Text style={styles.votedText}>You have already voted</Text>
            ) : (
              <Button
                title="Vote"
                onPress={() => voteForCandidate(item.party, item.name)}
                disabled={hasVoted}
              />
            )}
          </View>
          )
        }
         
        }
      />
      
    </>
  )}
  {electionStatus === 'ongoing' && hasVoted && (
      <Text style={styles.votedText}>
        You have voted for {votedParty ? votedParty : 'a party'}. Thank you for participating!
      </Text>
      )}
      <Button
        title="Logout"
        onPress={() => navigation.navigate('Login')}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  candidateContainer: {
    padding: 10,
    marginVertical: 5,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
  },
  text: {
    fontSize: 16,
    marginBottom: 5,
  },
  votedText: {
    fontSize: 16,
    color: 'red',
    marginBottom: 5,
  }, outcome: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'green',
    marginBottom: 16,
  },
  results: {
    marginTop: 16,
  },
  resultsHeading: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  resultItem: {
    marginBottom: 8,
  },
});

export default VoterDashboard;
