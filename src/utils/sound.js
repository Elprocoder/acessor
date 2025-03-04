import { Audio } from 'expo-av';

// Sons disponíveis:
// - notification: Para notificações do app
// - success: Para confirmações importantes
// - error: Para alertas de erro
// Usar sons apenas para:
// 1. Alertar erros
// 2. Notificar quando o tempo de uma tarefa esgota
// 3. Notificar quando chega uma nova notificação

const soundFiles = {
  notification: require('../assets/sounds/notification.mp3'),
  success: require('../assets/sounds/success.mp3'),
  error: require('../assets/sounds/error.mp3'),
};

let sounds = {
  notification: null,
  success: null,
  error: null,
};

export const initSounds = async () => {
  try {
    const { sound: notificationSound } = await Audio.Sound.createAsync(soundFiles.notification);
    const { sound: successSound } = await Audio.Sound.createAsync(soundFiles.success);
    const { sound: errorSound } = await Audio.Sound.createAsync(soundFiles.error);

    sounds = {
      notification: notificationSound,
      success: successSound,
      error: errorSound,
    };
  } catch (error) {
    console.error('Erro ao carregar sons:', error);
  }
};

export const playSound = async (soundName) => {
  try {
    const sound = sounds[soundName];
    if (!sound) return;

    await sound.replayAsync();
  } catch (error) {
    if (!error.message?.includes('background')) {
      console.error('Erro ao reproduzir som:', error);
    }
  }
};
