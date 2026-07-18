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
import { useUsage } from '../Usage/UsageContext';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function Profile() {
  const { clearAllUsage } = useUsage();
  const [userName, setUserName] = useState('Mr Cat');
  const [profileImage, setProfileImage] = useState(null);
  const [language, setLanguage] = useState(null);
  const [isLanguageOpen, setIsLanguageOpen] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [helpCenterVisible, setHelpCenterVisible] = useState(false);
  const [aboutModalVisible, setAboutModalVisible] = useState(false);
  const [changePasswordModalVisible, setChangePasswordModalVisible] = useState(false);

  const [editName, setEditName] = useState(userName);
  const [editNumber, setEditNumber] = useState('+95 9 123 456 789');
  const [editGmail, setEditGmail] = useState('cat85@gmail.com');
  const [editProfileImage, setEditProfileImage] = useState(profileImage);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const { signOut } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

//help center
  const HelpCenterContent = () => (
    <ScrollView contentContainerStyle={styles.helpScrollContent} showsVerticalScrollIndicator={true}>
      <View style={styles.helpCard}>
        <Text style={styles.helpSectionTitle}>How to Track Energy Usage</Text>
        <Text style={styles.helpSubTitle}>How to add your daily energy usage?</Text>
        <Text style={styles.helpBullet}>• Select your device from the list.</Text>
        <Image source={require('../../assets/track-duration-wattage.jpg')} style={styles.helpImage} resizeMode="contain" />
        <Text style={styles.helpBullet}>• Choose the wattage (appliance type/ model).</Text>
        <Text style={styles.helpBullet}>• Enter the duration (usage hours).</Text>
        <Text style={styles.helpBullet}>• Tap the "+" button to log it.</Text>
        <Image source={require('../../assets/addusagedetail.jpg')} style={styles.helpImage} resizeMode="contain" />
        <Text style={styles.helpBullet}>• Press the "Calculate Bill" button to save your total usage and instantly calculate your daily cost.</Text>
        <View style={styles.calculateButtonContainer}>
          <View style={styles.calculateButton}>
            <Text style={styles.calculateButtonText}>Calculate Bill</Text>
          </View>
        </View>
      </View>

      <View style={styles.helpCard}>
        <Text style={styles.helpSubTitle}>How to find your appliance wattage?</Text>
        <Text style={styles.helpBullet}><Text style={styles.helpBold}>• Check the Product Label:</Text> Look for a silver or white sticker/plate on the back or bottom of your appliance.</Text>
        <Text style={styles.helpBullet}><Text style={styles.helpBold}>• Locate the "W" or "Watt" Value:</Text> Look for a number followed by a W (e.g., 1000W or 60W).</Text>
        <Text style={styles.helpBullet}><Text style={styles.helpBold}>• Check the User Manual or Box:</Text> If the label is scratched off, you can find the power specification in the manual or on the original packaging.</Text>
      </View>

      <View style={styles.helpCard}>
        <Text style={styles.helpSubTitle}>Understanding your dashboard graphs</Text>
        <Text style={styles.helpParagraph}>EasyEco turns your scanned monthly bills into simple, easy-to-read visual charts. Here is how to understand the data on your dashboard:</Text>
        <Text style={styles.helpBullet}><Text style={styles.helpBold}>• How its updates:</Text> Every time you scan a new electricity bill, the AI automatically extracts your total units (kWh) and adds a new bar for that month.</Text>
        <Text style={styles.helpBullet}><Text style={styles.helpBold}>• How to read it:</Text>{'\n'}Higher bars: Mean you used more electricity that month.{'\n'}Lower bars: Mean your energy-saving efforts worked!</Text>
      </View>

      <View style={styles.helpCard}>
        <Text style={styles.helpSubTitle}>Using the AI Smart Bill Analyst</Text>
        <Text style={styles.helpSubSubTitle}>How to Scan Your Electricity Bill</Text>
        <Text style={styles.helpNumbered}>1. Open the AI Assistant.</Text>
        <Text style={styles.helpNumbered}>2. Tap the Upload Image button.</Text>
        <Text style={styles.helpNumbered}>3. Take or select a clear photo of your electricity bill.</Text>
        <Text style={styles.helpNumbered}>4. Wait for AI to analyze your bill.</Text>
        <Text style={styles.helpNumbered}>5. View your usage details and energy-saving suggestions.</Text>
        <Text style={styles.helpSubSubTitle}>Photo Tips for Best AI Analysis</Text>
        <Text style={styles.helpBullet}>• Take a clear and well-lit photo.</Text>
        <Text style={styles.helpBullet}>• Make sure all text on the bill is visible.</Text>
        <Text style={styles.helpBullet}>• Keep the bill flat and avoid shadows.</Text>
        <Text style={styles.helpBullet}>• Capture the entire bill in the frame.</Text>
        <Text style={styles.helpBullet}>• Avoid blurry or tilted images.</Text>
        <Text style={styles.helpSubSubTitle}>What Data Does the AI Extract?</Text>
        <Text style={styles.helpBullet}>• Meter reading</Text>
        <Text style={styles.helpBullet}>• Previous and current usage</Text>
        <Text style={styles.helpBullet}>• Electricity units (kWh)</Text>
        <Text style={styles.helpBullet}>• Billing amount</Text>
        <Text style={styles.helpBullet}>• Billing period</Text>
        <Text style={styles.helpBullet}>• Usage trends</Text>
        <Text style={styles.helpBullet}>• Energy-saving recommendations</Text>
      </View>

      <View style={styles.helpCard}>
        <Text style={styles.helpSubTitle}>Contact us</Text>
        <Text style={styles.helpParagraph}>Need help? We're here to assist you.{'\n'}Email: <Text style={styles.helpEmail}>support@easyeco.com</Text></Text>
      </View>
    </ScrollView>
  );

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

  const goToHelpCenter = () => setHelpCenterVisible(true);
  const goToAbout = () => setAboutModalVisible(true);
  const goToChangePassword = () => setChangePasswordModalVisible(true);

  const handleSavePassword = () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'New passwords do not match');
      return;
    }
    Alert.alert('Success', 'Password changed successfully');
    setChangePasswordModalVisible(false);
  };

  const handleLogout = () => {
    Alert.alert('Log out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log out', onPress: async () => {
          setIsLoggingOut(true);
          try {
            clearAllUsage();
            await signOut();
          } catch (error) {
            Alert.alert('Error', 'Failed to log out');
          } finally {
            setIsLoggingOut(false);
          }
        },
      },
    ]);
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Sorry, we need camera roll permissions to change your photo.', [{ text: 'OK' }]);
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
      Alert.alert('Permission Required', 'Sorry, we need camera roll permissions to change your photo.', [{ text: 'OK' }]);
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
      <ScrollView 
      style={{ flex: 1 }}
      contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header */}
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
        </View>

        {/* Account Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <View style={styles.box}>
            <TouchableOpacity style={styles.boxRow} onPress={handleEditProfile}>
              <View style={styles.rowLeft}>
                <Image source={require('../../assets/Edi.png')} style={{ width: 22, height: 22 }} resizeMode="contain" />
                <Text style={styles.boxRowText}>Edit Profile</Text>
              </View>
            </TouchableOpacity>
            <View style={styles.divider} />
            <TouchableOpacity style={styles.boxRow} onPress={goToChangePassword}>
              <View style={styles.rowLeft}>
                <Image source={require('../../assets/pass.png')} style={{ width: 22, height: 22 }} resizeMode="contain" />
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
                <Image source={require('../../assets/Lang.png')} style={{ width: 22, height: 22 }} resizeMode="contain" />
                <Text style={styles.boxRowText}>Language</Text>
              </View>
            </TouchableOpacity>
            {isLanguageOpen && (
              <View style={styles.dropdownContainer}>
                <TouchableOpacity style={styles.dropdownOption} onPress={() => selectLanguage('English')}>
                  <Text style={styles.dropdownText}>English</Text>
                  {language === 'English' && <Ionicons name="checkmark" size={20} color="#007AFF" />}
                </TouchableOpacity>
                <View style={styles.divider} />
                <TouchableOpacity style={styles.dropdownOption} onPress={() => selectLanguage('Myanmar')}>
                  <Text style={styles.dropdownText}>Myanmar</Text>
                  {language === 'Myanmar' && <Ionicons name="checkmark" size={20} color="#007AFF" />}
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
                <Image source={require('../../assets/Help.png')} style={{ width: 22, height: 22 }} resizeMode="contain" />
                <Text style={styles.boxRowText}>Help Center</Text>
              </View>
            </TouchableOpacity>
            <View style={styles.divider} />
            <TouchableOpacity style={styles.boxRow} onPress={goToAbout}>
              <View style={styles.rowLeft}>
                <Image source={require('../../assets/Info.png')} style={{ width: 22, height: 22 }} resizeMode="contain" />
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
      <Modal animationType="slide" transparent={false} visible={editModalVisible} onRequestClose={cancelEdit}>
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity style={styles.headerPillButton} onPress={cancelEdit}>
              <Text style={styles.headerPillText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerPillButton} onPress={saveProfile}>
              <Text style={styles.headerPillText}>Done</Text>
            </TouchableOpacity>
          </View>
          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.editPhotoContainer}>
              <TouchableOpacity onPress={pickImageForModal} activeOpacity={0.8}>
                <View style={styles.editAvatarContainer}>
                  {editProfileImage ? (
                    <Image source={{ uri: editProfileImage }} style={styles.editAvatarImage} />
                  ) : (
                    <View style={styles.editAvatarPlaceholder}>
                      <Ionicons name="person" size={40} color="#ccc" />
                    </View>
                  )}
                </View>
              </TouchableOpacity>
              <TouchableOpacity onPress={pickImageForModal}>
                <Text style={styles.changePhotoText}>Change Photo</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.inputSection}>
              <Text style={styles.inputLabel}>Update your name</Text>
              <TextInput style={styles.inputField} value={editName} onChangeText={setEditName} placeholder="Enter your name" placeholderTextColor="#999" />
            </View>
            <View style={styles.infoContainer}>
              <View style={styles.infoRow}>
                <Ionicons name="call-outline" size={20} color="#1A1A1A" style={styles.infoIcon} />
                <View style={styles.infoTextWrapper}>
                  <Text style={styles.infoLabel}>Number</Text>
                  <TextInput style={styles.infoInput} value={editNumber} onChangeText={setEditNumber} placeholder="Enter phone number" placeholderTextColor="#999" keyboardType="phone-pad" />
                </View>
              </View>
            </View>
            <View style={styles.infoContainer}>
              <View style={styles.infoRow}>
                <Ionicons name="mail-outline" size={20} color="#1A1A1A" style={styles.infoIcon} />
                <View style={styles.infoTextWrapper}>
                  <Text style={styles.infoLabel}>Gmail</Text>
                  <TextInput style={styles.infoInput} value={editGmail} onChangeText={setEditGmail} placeholder="Enter email address" placeholderTextColor="#999" keyboardType="email-address" autoCapitalize="none" />
                </View>
              </View>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Help Center Modal */}
      <Modal animationType="slide" transparent={false} visible={helpCenterVisible} onRequestClose={() => setHelpCenterVisible(false)}>
        <SafeAreaView style={styles.helpCenterContainer}>
          
            <TouchableOpacity onPress={() => setHelpCenterVisible(false)} style={styles.helpCenterBackButton}>
              <Ionicons name="chevron-back" size={28} color="#1A1A1A" />
            </TouchableOpacity>
            
            <View style={{ width: 40 }} />
          
          <HelpCenterContent />
        </SafeAreaView>
      </Modal>

      {/* About Modal */}
      <Modal animationType="slide" transparent={false} visible={aboutModalVisible} onRequestClose={() => setAboutModalVisible(false)}>
        <SafeAreaView style={styles.aboutModalContainer}>
          <View style={styles.aboutModalHeader}>
            <TouchableOpacity onPress={() => setAboutModalVisible(false)} style={styles.aboutBackButton}>
              <Ionicons name="chevron-back" size={28} color="#1A1A1A" />
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={styles.aboutScrollContent} showsVerticalScrollIndicator={false}>
            <View style={styles.logoContainer}>
              <Image source={require('../../assets/Logoact2.png')} style={styles.logoImage} resizeMode="contain" />
              <Text style={styles.appName}>EasyEco</Text>
            </View>
            <Text style={styles.versionText}>Version 1.0.0</Text>
            <Text style={styles.description}>EasyEco is an AI-powered electricity management app that helps users estimate electricity bills, monitor energy usage, analyze electricity bills with AI, and receive personalized energy-saving recommendations. The app also provides usage history, monthly comparison graphs, and smart notifications to support better electricity management.</Text>
            <Text style={styles.featuresTitle}>Key Features</Text>
            <View style={styles.featuresList}>
              <Text style={styles.featureItem}>• Bill Calculator</Text>
              <Text style={styles.featureItem}>• Monthly Bill Estimation</Text>
              <Text style={styles.featureItem}>• Usage History & Graphs</Text>
              <Text style={styles.featureItem}>• AI Bill Analysis</Text>
              <Text style={styles.featureItem}>• AI Chatbot</Text>
              <Text style={styles.featureItem}>• Energy-Saving Tips</Text>
              <Text style={styles.featureItem}>• Notifications</Text>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Change Password Modal */}
      <Modal animationType="slide" transparent={false} visible={changePasswordModalVisible} onRequestClose={() => setChangePasswordModalVisible(false)}>
        <SafeAreaView style={styles.changePasswordContainer}>
          <View style={styles.changePasswordHeader}>
            <TouchableOpacity onPress={() => setChangePasswordModalVisible(false)} style={styles.changePasswordBackButton}>
              <Ionicons name="chevron-back" size={28} color="#1A1A1A" />
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={styles.changePasswordScrollContent} showsVerticalScrollIndicator={false}>
            <Text style={styles.changePasswordTitle}>Change Password</Text>
            <View style={styles.passwordInputSection}>
              <Text style={styles.passwordInputLabel}>Current Password</Text>
              <TextInput style={styles.passwordInputField} value={currentPassword} onChangeText={setCurrentPassword} placeholder="Enter Current Password" placeholderTextColor="#999" secureTextEntry />
            </View>
            <View style={styles.passwordInputSection}>
              <Text style={styles.passwordInputLabel}>New Password</Text>
              <TextInput style={styles.passwordInputField} value={newPassword} onChangeText={setNewPassword} placeholder="Enter New Password" placeholderTextColor="#999" secureTextEntry />
            </View>
            <View style={styles.passwordInputSection}>
              <Text style={styles.passwordInputLabel}>Confirm New Password</Text>
              <TextInput style={styles.passwordInputField} value={confirmPassword} onChangeText={setConfirmPassword} placeholder="Confirm New Password" placeholderTextColor="#999" secureTextEntry />
            </View>
            <TouchableOpacity style={styles.saveButton} onPress={handleSavePassword} activeOpacity={0.8}>
              <Text style={styles.saveButtonText}>Save</Text>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#ffffff',flexGrow: 1  },
  container: { paddingHorizontal: 36, paddingVertical: 36,paddingBottom: 100 ,borderRadius:50 },
  header: { alignItems: 'center', marginBottom: 28 },
  avatarContainer: { width: 100, height: 100, borderRadius: 80, marginBottom: 14, overflow: 'hidden' },
  avatarImage: { width: 100, height: 100, borderRadius: 50, borderWidth: 3, borderColor: '#e8e8ed' },
  avatarPlaceholder: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#f0f0f0', justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: '#e8e8ed' },
  userName: { fontSize: 22, fontWeight: '700', color: '#1a1a2e' },
  section: { marginBottom: 28 },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: '#007AFF', marginBottom: 12, letterSpacing: 0.3 },
  box: { backgroundColor: '#F0F0F0', borderRadius: 15, overflow: 'hidden' },
  boxRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 16, paddingHorizontal: 18 },
  rowLeft: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  boxRowText: { fontSize: 16, fontWeight: '500', color: '#100303' },
  divider: { height: 1, backgroundColor: '#E0E0E0', marginHorizontal: 18, },
  dropdownContainer: { paddingHorizontal: 8, paddingBottom: 8 },
  dropdownOption: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14, paddingHorizontal: 12, borderRadius: 10, marginHorizontal: 4 },
  dropdownOptionSelected: { backgroundColor: '#C8D9F0' },
  dropdownText: { fontSize: 16, color: '#1A1A1A', fontWeight: '400' },
  logoutText: { fontSize: 16, fontWeight: '600', color: '#ff3b30' },

  // Help Center
  helpCenterContainer: { flex: 1, backgroundColor: '#ffffff' },
  helpCenterHeader: { backgroundColor: '#fff', paddingHorizontal: 16, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#E0E0E0' },
  helpCenterBackButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'flex-start' },
  helpCenterHeaderTitle: { flex: 1, textAlign: 'center', fontSize: 20, fontWeight: '600', color: '#1a1a1a', marginRight: 40 },
  helpScrollContent: { padding: 16, paddingBottom: 18 },
  helpCard: { backgroundColor: '#fff', borderRadius: 4, padding: 20, marginBottom: 16 },
  helpSectionTitle: { fontSize: 18, fontWeight: '700', color: '#1a1a1a', marginBottom: 8 },
  helpSubTitle: { fontSize: 15, fontWeight: '600', color: '#333', marginBottom: 12 },
  helpSubSubTitle: { fontSize: 14, fontWeight: '600', color: '#444', marginTop: 16, marginBottom: 10 },
  helpBullet: { fontSize: 14, lineHeight: 24, color: '#444', marginBottom: 4 },
  helpNumbered: { fontSize: 14, lineHeight: 24, color: '#444', marginBottom: 4, paddingLeft: 4 },
  helpParagraph: { fontSize: 14, lineHeight: 24, color: '#444', marginBottom: 12 },
  helpBold: { fontWeight: '600' },
  helpImage: { width: '100%', height: 220, marginVertical: 12, borderRadius: 8 },
  calculateButtonContainer: { alignItems: 'center', marginTop: 8 },
  calculateButton: { backgroundColor: '#2563EB', paddingHorizontal: 28, paddingVertical: 10, borderRadius: 24 },
  calculateButtonText: { color: '#fff', fontSize: 14, fontWeight: '500' },
  helpEmail: { color: '#2563EB' },

  // Edit Profile
  modalContainer: { flex: 1, paddingHorizontal: 20, paddingTop: 10, backgroundColor: '#fff' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, marginBottom: 20 },
  headerPillButton: { backgroundColor: '#E8E8E8', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  headerPillText: { fontSize: 15, color: '#1A1A1A', fontWeight: '600' },
  editPhotoContainer: { alignItems: 'center', marginBottom: 24 },
  editAvatarContainer: { width: 100, height: 100, borderRadius: 50, marginBottom: 12, overflow: 'hidden' },
  editAvatarImage: { width: 100, height: 100, borderRadius: 50 },
  editAvatarPlaceholder: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#E8E8E8', justifyContent: 'center', alignItems: 'center' },
  changePhotoText: { fontSize: 14, color: '#007AFF', fontWeight: '500', marginTop: 4 },
  inputSection: { marginBottom: 20 },
  inputLabel: { fontSize: 14, fontWeight: '400', color: '#333', marginBottom: 10, paddingHorizontal: 4 },
  inputField: { borderWidth: 1, borderColor: '#E8E8E8', borderRadius: 14, paddingVertical: 14, paddingHorizontal: 16, fontSize: 16, color: '#1A1A1A', backgroundColor: '#F0F0F0' },
  infoContainer: { backgroundColor: '#F0F0F0', borderRadius: 14, paddingVertical: 16, paddingHorizontal: 16, marginBottom: 16 },
  infoRow: { flexDirection: 'row', alignItems: 'flex-start' },
  infoIcon: { marginRight: 14, marginTop: 2 },
  infoTextWrapper: { flex: 1 },
  infoLabel: { fontSize: 15, fontWeight: '400', color: '#1A1A1A', marginBottom: 4 },
  infoInput: { fontSize: 16, color: '#1A1A1A', paddingVertical: 0, paddingHorizontal: 0, fontWeight: '400' },

  // About
  aboutModalContainer: { flex: 1, backgroundColor: '#FFFFFF' },
  aboutModalHeader: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 8 },
  aboutBackButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'flex-start' },
  aboutScrollContent: { paddingHorizontal: 24, paddingBottom: 40 },
  logoContainer: { alignItems: 'center', marginTop: 8, marginBottom: 12 },
  logoImage: { width: 80, height: 80, marginBottom: 12 },
  appName: { fontSize: 20, fontWeight: '500', color: '#2E7DFF' },
  versionText: { fontSize: 16, color: '#1A1A1A', marginBottom: 20, textAlign: 'left' },
  description: { fontSize: 15, color: '#1A1A1A', lineHeight: 24, marginBottom: 28 },
  featuresTitle: { fontSize: 16, fontWeight: '500', color: '#1A1A1A', marginBottom: 12 },
  featuresList: { gap: 8 },
  featureItem: { fontSize: 15, color: '#1A1A1A', lineHeight: 22 },

  // Change Password
  changePasswordContainer: { flex: 1, backgroundColor: '#FFFFFF' },
  changePasswordHeader: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 8 },
  changePasswordBackButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'flex-start' },
  changePasswordScrollContent: { paddingHorizontal: 24, paddingTop: 20, paddingBottom: 40 },
  changePasswordTitle: { fontSize: 22, fontWeight: '600', color: '#1A5FCC', textAlign: 'center', marginBottom: 48 },
  passwordInputSection: { marginBottom: 20 },
  passwordInputLabel: { fontSize: 15, fontWeight: '400', color: '#1A1A1A', marginBottom: 10 },
  passwordInputField: { backgroundColor: '#F0F0F0', borderRadius: 14, paddingVertical: 16, paddingHorizontal: 20, fontSize: 15, color: '#1A1A1A' },
  saveButton: { backgroundColor: '#1A5FCC', borderRadius: 26, paddingVertical: 16, alignItems: 'center', marginTop: 32, marginHorizontal: 20 },
  saveButtonText: { fontSize: 16, fontWeight: '600', color: '#FFFFFF' },
});