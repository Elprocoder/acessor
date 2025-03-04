import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  Alert,
  ScrollView,
  useColorScheme,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { auth, db } from '../firebaseConfig';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { registerForPushNotificationsAsync, configurePushNotifications } from '../utils/notifications';
import { useTheme } from '../contexts/ThemeContext';
import { playSound, initSounds } from '../utils/sound';

const SettingsScreen = ({ navigation }) => {
  const { theme, isDarkMode, setIsDarkMode } = useTheme();
  const [settings, setSettings] = useState({
    notifications: true,
    darkMode: isDarkMode,
    soundEnabled: true,
    emailNotifications: true,
    showCompletedTasks: true,
  });

  const loadSettings = async () => {
    try {
      const settingsRef = doc(db, 'userSettings', auth.currentUser.uid);
      const settingsSnap = await getDoc(settingsRef);
      
      if (settingsSnap.exists()) {
        const userSettings = settingsSnap.data();
        setSettings(userSettings);
        setIsDarkMode(userSettings.darkMode);
      } else {
        // Se não existir, cria com valores padrão
        await setDoc(settingsRef, settings);
        
        // Configurar notificações push pela primeira vez
        if (settings.notifications) {
          await registerForPushNotificationsAsync(auth.currentUser.uid);
          await configurePushNotifications();
        }
      }
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
    }
  };

  useEffect(() => {
    loadSettings();
    initSounds();
  }, []);

  const updateSetting = async (key, value) => {
    try {
      const newSettings = { ...settings, [key]: value };
      setSettings(newSettings);
      
      // Atualizar tema global se darkMode for alterado
      if (key === 'darkMode') {
        setIsDarkMode(value);
      }
      
      // Tocar som de alteração se estiver habilitado
      if (settings.soundEnabled && key !== 'soundEnabled') {
        await playSound('success');
      }

      const settingsRef = doc(db, 'userSettings', auth.currentUser.uid);
      await setDoc(settingsRef, newSettings);

      // Ações específicas para cada configuração
      switch (key) {
        case 'notifications':
          if (value) {
            await registerForPushNotificationsAsync(auth.currentUser.uid);
            await configurePushNotifications();
          }
          break;
      }
    } catch (error) {
      console.error('Erro ao atualizar configuração:', error);
      Alert.alert('Erro', 'Não foi possível salvar a configuração');
      
      // Tocar som de erro se estiver habilitado
      if (settings.soundEnabled) {
        await playSound('error');
      }
    }
  };

  const handleSignOut = () => {
    Alert.alert(
      'Sair',
      'Tem certeza que deseja sair?',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Sair',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut(auth);
              navigation.reset({
                index: 0,
                routes: [{ name: 'Login' }],
              });
            } catch (error) {
              console.error('Erro ao fazer logout:', error);
              Alert.alert('Erro', 'Não foi possível fazer logout');
            }
          },
        },
      ],
    );
  };

  const SettingItem = ({ icon, title, description, value, onValueChange }) => (
    <View style={[styles.settingItem, { backgroundColor: theme.surface }]}>
      <View style={styles.settingContent}>
        <View style={styles.settingIcon}>
          <Ionicons name={icon} size={24} color="#38D7E7" />
        </View>
        <View style={styles.settingText}>
          <Text style={[styles.settingTitle, { color: theme.text }]}>{title}</Text>
          <Text style={[styles.settingDescription, { color: theme.textSecondary }]}>{description}</Text>
        </View>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: '#767577', true: '#38D7E7' }}
        thumbColor={value ? '#fff' : '#f4f3f4'}
      />
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
        <TouchableOpacity 
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Configurações</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Notificações</Text>
          <SettingItem
            icon="notifications-outline"
            title="Notificações Push"
            description="Receba notificações sobre suas tarefas"
            value={settings.notifications}
            onValueChange={(value) => updateSetting('notifications', value)}
          />
          <SettingItem
            icon="mail-outline"
            title="Notificações por Email"
            description="Receba lembretes por email"
            value={settings.emailNotifications}
            onValueChange={(value) => updateSetting('emailNotifications', value)}
          />
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Aparência</Text>
          <SettingItem
            icon="moon-outline"
            title="Modo Escuro"
            description="Alterar para tema escuro"
            value={settings.darkMode}
            onValueChange={(value) => updateSetting('darkMode', value)}
          />
          <SettingItem
            icon="volume-high-outline"
            title="Sons"
            description="Ativar sons do aplicativo"
            value={settings.soundEnabled}
            onValueChange={(value) => updateSetting('soundEnabled', value)}
          />
          {settings.soundEnabled && (
            <TouchableOpacity
              style={[styles.testButton, { backgroundColor: theme.surface }]}
              onPress={() => navigation.navigate('TestSound')}
            >
              <Ionicons name="musical-notes-outline" size={24} color="#38D7E7" />
              <Text style={[styles.testButtonText, { color: theme.text }]}>Testar Sons</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Tarefas</Text>
          <SettingItem
            icon="checkmark-done-outline"
            title="Mostrar Tarefas Concluídas"
            description="Exibir tarefas concluídas na lista"
            value={settings.showCompletedTasks}
            onValueChange={(value) => updateSetting('showCompletedTasks', value)}
          />
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Conta</Text>
          <View style={[styles.accountInfo, { backgroundColor: theme.surface }]}>
            <Text style={[styles.emailText, { color: theme.text }]}>{auth.currentUser?.email}</Text>
          </View>
          <TouchableOpacity
            style={[styles.signOutButton, { backgroundColor: theme.surface }]}
            onPress={handleSignOut}
          >
            <Ionicons name="log-out-outline" size={24} color="#EE316B" />
            <Text style={styles.signOutText}>Sair</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 48,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  headerRight: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  settingContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 16,
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(56, 215, 231, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingText: {
    marginLeft: 12,
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
  },
  accountInfo: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  emailText: {
    fontSize: 16,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 8,
  },
  signOutText: {
    fontSize: 16,
    color: '#EE316B',
    marginLeft: 8,
  },
  testButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 8,
    marginTop: 8,
  },
  testButtonText: {
    marginLeft: 12,
    fontSize: 16,
    fontWeight: '500',
  },
});

export default SettingsScreen;
