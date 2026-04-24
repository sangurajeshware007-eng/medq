import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors } from '../../constants/Colors';
import { MapPin, Video, Info } from 'lucide-react-native';
import { crossPlatformShadow } from '../../utils/shadow';

interface ConsultationOptionsProps {
  doctor: any;
  selectedType: 'offline' | 'online';
  onSelect: (type: 'offline' | 'online') => void;
}

export default function ConsultationOptions({ doctor, selectedType, onSelect }: ConsultationOptionsProps) {
  const offlineFee = doctor.consultationFee || (doctor.hospitals && doctor.hospitals[0]?.consultationFee) || 500;
  const onlineFee = doctor.teleFee || 600;

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Consultation Options</Text>
      
      <View style={styles.optionsRow}>
        <TouchableOpacity 
          style={[
            styles.optionCard, 
            selectedType === 'offline' && styles.optionCardActive,
            { borderColor: selectedType === 'offline' ? Colors.primary : Colors.borderLight }
          ]}
          onPress={() => onSelect('offline')}
        >
          <View style={[styles.iconContainer, { backgroundColor: selectedType === 'offline' ? Colors.primaryLight : Colors.background }]}>
            <MapPin size={20} color={selectedType === 'offline' ? Colors.primary : Colors.textSecondary} />
          </View>
          <View style={styles.optionDetails}>
            <Text style={[styles.optionTitle, selectedType === 'offline' && styles.optionTitleActive]}>In-Clinic</Text>
            <Text style={styles.optionFee}>₹{offlineFee}</Text>
          </View>
          {selectedType === 'offline' && <View style={styles.checkIcon}>
            <Text style={styles.checkText}>✓</Text>
          </View>}
        </TouchableOpacity>

        <TouchableOpacity 
          style={[
            styles.optionCard, 
            selectedType === 'online' && styles.optionCardActive,
            { borderColor: selectedType === 'online' ? Colors.feature?.token || Colors.primary : Colors.borderLight }
          ]}
          onPress={() => onSelect('online')}
        >
          <View style={[styles.iconContainer, { backgroundColor: selectedType === 'online' ? (Colors.feature?.tokenLight || Colors.primaryLight) : Colors.background }]}>
            <Video size={20} color={selectedType === 'online' ? (Colors.feature?.token || Colors.primary) : Colors.textSecondary} />
          </View>
          <View style={styles.optionDetails}>
            <Text style={[styles.optionTitle, selectedType === 'online' && styles.optionTitleActive]}>Video Consult</Text>
            <Text style={styles.optionFee}>₹{onlineFee}</Text>
          </View>
          {selectedType === 'online' && <View style={[styles.checkIcon, { backgroundColor: Colors.feature?.token || Colors.primary }]}>
            <Text style={styles.checkText}>✓</Text>
          </View>}
        </TouchableOpacity>
      </View>

      <View style={styles.infoBox}>
        <Info size={14} color={Colors.textLight} />
        <Text style={styles.infoText}>
          {selectedType === 'offline' 
            ? 'Meet the doctor at their clinic. Prior appointment recommended.' 
            : 'Safe & private video call consultation from anywhere.'}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.white,
    padding: 20,
    borderRadius: 24,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.text,
    marginBottom: 16,
  },
  optionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  optionCard: {
    flex: 1,
    padding: 16,
    borderRadius: 20,
    borderWidth: 2,
    backgroundColor: Colors.white,
    position: 'relative',
    ...crossPlatformShadow({ color: Colors.shadow, offsetY: 2, opacity: 0.05, radius: 8, elevation: 2 }),
  },
  optionCardActive: {
    backgroundColor: Colors.white,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  optionDetails: {
    gap: 4,
  },
  optionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  optionTitleActive: {
    color: Colors.text,
  },
  optionFee: {
    fontSize: 18,
    fontWeight: '900',
    color: Colors.text,
  },
  checkIcon: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkText: {
    color: Colors.white,
    fontSize: 10,
    fontWeight: '900',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.background,
    padding: 12,
    borderRadius: 12,
  },
  infoText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '500',
    flex: 1,
  },
});
