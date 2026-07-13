import Ionicons from '@expo/vector-icons/Ionicons';
import * as ImagePicker from 'expo-image-picker';
import React, { useState } from 'react';
import {
  Alert,
  Image,
  LayoutAnimation,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  UIManager,
  View,
} from 'react-native';
import { useAuth } from '../context/AuthContext';


// Enable LayoutAnimation for Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function Profile() {
  const [userName, setUserName] = useState('Mr Cat');
  const [profileImage, setProfileImage] = useState(null);
  const [language, setLanguage] = useState(null);
  const [isLanguageOpen, setIsLanguageOpen] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);

  const [editName, setEditName] = useState(userName);
  const [editNumber, setEditNumber] = useState('+95 9 123 456 789');
  const [editGmail, setEditGmail] = useState('cat85@gmail.com');
  const [editProfileImage, setEditProfileImage] = useState(profileImage);
  const { signOut } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleEditProfile = () => {
    setEditName(userName);
    setEditProfileImage(profileImage);
    setEditModalVisible(true);
  };

  const saveProfile = () => {
    setUserName(editName);
     setProfileImage(editProfileImage);
    setEditModalVisible(false);
  };

    const cancelEdit = () => {
    setEditModalVisible(false);
  };

  const toggleLanguageDropdown = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsLanguageOpen(!isLanguageOpen);
  };

  const selectLanguage = (lang) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setLanguage(lang);
    setIsLanguageOpen(false);
  };

  const goToHelpCenter = () => {
    Alert.alert('Help Center', 'Navigate to Help Center screen');
  };

  const goToAbout = () => {
    Alert.alert('About', 'Navigate to About screen');
  };

  const handleLogout = () => {
    Alert.alert(
      'Log out',
      'Are you sure you want to log out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Log out', onPress:  async () => {
          setIsLoggingOut(true);
          try {
            await signOut();
            // No need to manually navigate - root layout handles it
          } catch (error) {
            Alert.alert('Error', 'Failed to log out');
          } finally {
            setIsLoggingOut(false); 
          }
          },
        },
      ]
    );
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'Sorry, we need camera roll permissions to change your photo.',
        [{ text: 'OK' }]
      );
      return;
    }
    

    

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setProfileImage(result.assets[0].uri);
    }
  };

  const pickImageForModal = async () => {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== 'granted') {
    Alert.alert(
      'Permission Required',
      'Sorry, we need camera roll permissions to change your photo.',
      [{ text: 'OK' }]
    );
    return;
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.7,
  });

  if (!result.canceled && result.assets && result.assets.length > 0) {
    setEditProfileImage(result.assets[0].uri);  
  }
};


  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        
        {/* Header: Avatar + Name */}
        <View style={styles.header}>
          <TouchableOpacity onPress={pickImage} activeOpacity={0.8}>
            <View style={styles.avatarContainer}>
              {profileImage ? (
                <Image source={{ uri: profileImage }} style={styles.avatarImage} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Ionicons name="person" size={40} color="#ccc" />
                </View>
              )}
              <View style={styles.cameraIconContainer}>
                <Ionicons name="camera" size={16} color="#fff" />
              </View>
            </View>
          </TouchableOpacity>
          
          <Text style={styles.userName}>{userName}</Text>
          <TouchableOpacity onPress={pickImage}>
            <Text style={styles.changePhotoText}></Text>
          </TouchableOpacity>
        </View>

        {/* Account Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <View style={styles.box}>
            <TouchableOpacity style={styles.boxRow} onPress={handleEditProfile}>
              <View style={styles.rowLeft}>
                <Image 
  source={require('../../assets/Edi.png')} 
  style={{ width: 22, height: 22 }} 
  resizeMode="contain"
/>
                <Text style={styles.boxRowText}>Edit Profile</Text>
              </View>
            </TouchableOpacity>
            <View style={styles.divider} />
            <TouchableOpacity style={styles.boxRow} onPress={() => Alert.alert('Change Password')}>
              <View style={styles.rowLeft}>
              <Image 
  source={require('../../assets/pass.png')} 
  style={{ width: 22, height: 22 }} 
  resizeMode="contain"
/>
                <Text style={styles.boxRowText}>Change Password</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Preference Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preference</Text>
          <View style={styles.box}>
            <TouchableOpacity style={styles.boxRow} onPress={toggleLanguageDropdown}>
              <View style={styles.rowLeft}>
               <Image 
  source={require('../../assets/Lang.png')} 
  style={{ width: 22, height: 22 }} 
  resizeMode="contain"
/>
                <Text style={styles.boxRowText}>Language</Text>
              </View>
            </TouchableOpacity>

            {isLanguageOpen && (
              <View style={styles.dropdownContainer}>
                <TouchableOpacity 
                  style={styles.dropdownOption} 
                  onPress={() => selectLanguage('English')}
                >
                  <Text style={styles.dropdownText}>English</Text>
                  {language === 'English' && (
                    <Ionicons name="checkmark" size={20} color="#007AFF" />
                  )}
                </TouchableOpacity>
                <View style={styles.divider} />
                <TouchableOpacity 
                  style={styles.dropdownOption} 
                  onPress={() => selectLanguage('Myanmar')}
                >
                  <Text style={styles.dropdownText}>Myanmar</Text>
                  {language === 'Myanmar' && (
                    <Ionicons name="checkmark" size={20} color="#007AFF" />
                  )}
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>

        {/* Support Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Support</Text>
          <View style={styles.box}>
            <TouchableOpacity style={styles.boxRow} onPress={goToHelpCenter}>
              <View style={styles.rowLeft}>
                 <Image source={require('../../assets/Help.png')} 
                  style={{ width: 22, height: 22 }} 
                    resizeMode="contain"
/>
                <Text style={styles.boxRowText}>Help Center</Text>
              </View>
            </TouchableOpacity>
            <View style={styles.divider} />
            <TouchableOpacity style={styles.boxRow} onPress={goToAbout}>
              <View style={styles.rowLeft}>
                <Image 
  source={require('../../assets/Info.png')} 
  style={{ width: 22, height: 22 }} 
  resizeMode="contain"
/>
                <Text style={styles.boxRowText}>About</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Logout Section */}
        <View style={styles.section}>
          <View style={styles.box}>
            <TouchableOpacity style={styles.boxRow} onPress={handleLogout}>
              <View style={styles.rowLeft}>
                <Ionicons name="log-out-outline" size={22} color="#1A1A1A" />
                <Text style={styles.logoutText}>Log out</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

      </ScrollView>

      {/* Edit Profile Modal */}
      <Modal
        animationType="slide"
        transparent={false}
        visible={editModalVisible}
        onRequestClose={cancelEdit}
      >
        <SafeAreaView style={styles.modalContainer}>
          {/* Header with gray pill Cancel/Done buttons */}
          <View style={styles.modalHeader}>
            <TouchableOpacity 
              style={styles.headerPillButton} 
              onPress={cancelEdit}
            >
              <Text style={styles.headerPillText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.headerPillButton} 
              onPress={saveProfile}
            >
              <Text style={styles.headerPillText}>Done</Text>
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Profile Photo */}
            <View style={styles.editPhotoContainer}>
              <TouchableOpacity onPress={pickImageForModal} activeOpacity={0.8}>
                <View style={styles.editAvatarContainer}>
                  {editProfileImage ? (
                    <Image source={{ uri: editProfileImage }} style={styles.editAvatarImage} />
                  ) : (
                    <View style={styles.editAvatarPlaceholder}>
                      <Image
                        source={{ uri: 'https://placehold.co/120x120/87CEEB/ffffff?text=Cat' }}
                        style={styles.editAvatarImage}
                      />
                    </View>
                  )}
                </View>
              </TouchableOpacity>
              <TouchableOpacity onPress={pickImageForModal}>
                <Text style={styles.changePhotoText}>Change Photo</Text>
              </TouchableOpacity>
            </View>

            {/* Update your name */}
            <View style={styles.inputSection}>
              <Text style={styles.inputLabel}>Update your name</Text>
              <TextInput
                style={styles.inputField}
                value={editName}
                onChangeText={setEditName}
                placeholder="Enter your name"
                placeholderTextColor="#999"
              />
            </View>

            {/* Number Container with Icon */}
            <View style={styles.infoContainer}>
              <View style={styles.infoRow}>
                <Ionicons name="call-outline" size={20} color="#1A1A1A" style={styles.infoIcon} />
                <View style={styles.infoTextWrapper}>
                  <Text style={styles.infoLabel}>Number</Text>
                  <TextInput
                    style={styles.infoInput}
                    value={editNumber}
                    onChangeText={setEditNumber}
                    placeholder="Enter phone number"
                    placeholderTextColor="#999"
                    keyboardType="phone-pad"
                  />
                </View>
              </View>
            </View>

            {/* Gmail Container with Icon */}
            <View style={styles.infoContainer}>
              <View style={styles.infoRow}>
                <Ionicons name="mail-outline" size={20} color="#1A1A1A" style={styles.infoIcon} />
                <View style={styles.infoTextWrapper}>
                  <Text style={styles.infoLabel}>Gmail</Text>
                  <TextInput
                    style={styles.infoInput}
                    value={editGmail}
                    onChangeText={setEditGmail}
                    placeholder="Enter email address"
                    placeholderTextColor="#999"
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>
              </View>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8f9fc',
  },
  container: {
    paddingHorizontal: 20,
    paddingVertical: 24,
  },

  // Header
  header: {
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarContainer: {
    position: 'relative',
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 12,
  },
  avatarImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: '#e8e8ed',
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#e8e8ed',
  },
  cameraIconContainer: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#007AFF',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#fff',
  },
  userName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a2e',
  },
  changePhotoText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
    marginTop: 4,
  },

  // Section
  section: {
    marginBottom: 9,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#007AFF',
    marginBottom: 8,
    letterSpacing: 0.3,
  },

  // Box
  box: {
    backgroundColor: '#F0F0F0',
    borderRadius: 14,
    overflow: 'hidden',
  },
  boxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 18,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  boxRowText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1A1A1A',
  },
  divider: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginHorizontal: 18,
  },

  // Dropdown
  dropdownContainer: {
    paddingHorizontal: 18,
    paddingBottom: 8,
  },
  dropdownOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 4,
  },
  dropdownText: {
    fontSize: 15,
    color: '#1a1a2e',
  },

  // Logout
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ff3b30',
  },

  // Edit Profile Modal
  modalContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 10,
    backgroundColor: '#fff',
  },

  // Gray pill header buttons
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    marginBottom: 20,
  },
  headerPillButton: {
    backgroundColor: '#E8E8E8',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  headerPillText: {
    fontSize: 15,
    color: '#1A1A1A',
    fontWeight: '600',
  },

  // Edit Photo
  editPhotoContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  editAvatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 12,
    overflow: 'hidden',
  },
  editAvatarImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  editAvatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#87CEEB',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Input Sections
  inputSection: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '400',
    color: '#333',
    marginBottom: 10,
    paddingHorizontal: 4,
  },
  inputField: {
    borderWidth: 1,
    borderColor: '#E8E8E8',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#1A1A1A',
    backgroundColor: '#F0F0F0',
  },

  // Number & Gmail Containers with Icons
  infoContainer: {
    backgroundColor: '#F0F0F0',
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  infoIcon: {
    marginRight: 14,
    marginTop: 2,
  },
  infoTextWrapper: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 15,
    fontWeight: '400',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  infoInput: {
    fontSize: 16,
    color: '#1A1A1A',
    paddingVertical: 0,
    paddingHorizontal: 0,
    fontWeight: '400',
  },
});