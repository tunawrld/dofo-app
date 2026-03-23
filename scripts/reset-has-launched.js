const AsyncStorage = require('@react-native-async-storage/async-storage').default;

async function resetLaunchStore() {
  try {
    await AsyncStorage.removeItem('hasLaunched');
    console.log("hasLaunched storage key has been removed successfully.");
  } catch (error) {
    console.error("Failed to remove hasLaunched key:", error);
  }
}

resetLaunchStore();
