import { useRouter } from 'expo-router';
import { Building2, Search, ChevronRight, CheckCircle, X } from 'lucide-react-native';
import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Switch,
  FlatList,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import Button from '../../components/Button';
import Card from '../../components/Card';
import Input from '../../components/Input';
import { Colors } from '../../constants/Colors';
import { useHospitals } from '../../hooks/useApiHooks';
import { doctorService } from '../../services/doctorService';
import type { HospitalListItem } from '../../services/hospitalService';
import { crossPlatformShadow } from '../../utils/shadow';

export default function AddHospitalScreen() {
  const router = useRouter();

  const [search, setSearch] = useState('');
  const [pickerVisible, setPickerVisible] = useState(false);
  const [selectedHospital, setSelectedHospital] = useState<HospitalListItem | null>(null);
  const [consultationFee, setConsultationFee] = useState('');
  const [roomNumber, setRoomNumber] = useState('');
  const [isPrimary, setIsPrimary] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const { data: hospitals = [], isLoading: hospitalsLoading } = useHospitals();

  const filtered = search.trim().length > 0
    ? hospitals.filter((h) =>
        h.name.toLowerCase().includes(search.toLowerCase()) ||
        h.address.toLowerCase().includes(search.toLowerCase()),
      )
    : hospitals;

  const handleSelect = (hospital: HospitalListItem) => {
    setSelectedHospital(hospital);
    setPickerVisible(false);
    setSearch('');
  };

  const handleSubmit = async () => {
    if (!selectedHospital) {
      Alert.alert('Required', 'Please select a hospital.');
      return;
    }
    const fee = consultationFee.trim() ? parseFloat(consultationFee) : undefined;
    if (fee !== undefined && isNaN(fee)) {
      Alert.alert('Invalid Fee', 'Consultation fee must be a number.');
      return;
    }

    setSubmitting(true);
    try {
      await doctorService.addHospital({
        hospitalId: selectedHospital.id,
        consultationFee: fee,
        roomNumber: roomNumber.trim() || undefined,
        isPrimary,
      });
      Alert.alert('Success', `${selectedHospital.name} has been added to your profile.`, [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? err?.message ?? 'Something went wrong.';
      Alert.alert('Error', msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <X size={22} color={Colors.text} strokeWidth={2.5} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add Hospital</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        style={styles.content}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.contentContainer}
      >
        {/* Hospital picker */}
        <Text style={styles.label}>Hospital *</Text>
        <TouchableOpacity style={styles.pickerRow} onPress={() => setPickerVisible(true)}>
          {selectedHospital ? (
            <View style={{ flex: 1 }}>
              <Text style={styles.pickerSelected}>{selectedHospital.name}</Text>
              <Text style={styles.pickerAddress} numberOfLines={1}>
                {selectedHospital.address}
              </Text>
            </View>
          ) : (
            <Text style={styles.pickerPlaceholder}>Select a hospital…</Text>
          )}
          <ChevronRight size={18} color={Colors.textLight} strokeWidth={2} />
        </TouchableOpacity>

        {/* Fee */}
        <Input
          label="Consultation Fee (₹)"
          value={consultationFee}
          onChangeText={setConsultationFee}
          placeholder="e.g. 300"
          keyboardType="decimal-pad"
        />

        {/* Room number */}
        <Input
          label="Room / OPD Number (optional)"
          value={roomNumber}
          onChangeText={setRoomNumber}
          placeholder="e.g. OPD-4"
        />

        {/* Primary toggle */}
        <Card style={styles.toggleCard}>
          <View style={styles.toggleRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.toggleLabel}>Set as Primary Hospital</Text>
              <Text style={styles.toggleSub}>Clears the primary flag on other hospitals</Text>
            </View>
            <Switch
              value={isPrimary}
              onValueChange={setIsPrimary}
              trackColor={{ false: Colors.borderLight, true: Colors.primary }}
              thumbColor={Colors.white}
            />
          </View>
        </Card>

        <Button
          title={submitting ? 'Saving…' : 'Add Hospital'}
          onPress={handleSubmit}
          disabled={submitting || !selectedHospital}
          style={styles.submitBtn}
        />
      </ScrollView>

      {/* Hospital picker modal */}
      <Modal visible={pickerVisible} animationType="slide" onRequestClose={() => setPickerVisible(false)}>
        <SafeAreaView style={styles.modalContainer} edges={['top', 'bottom']}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Hospital</Text>
            <TouchableOpacity onPress={() => setPickerVisible(false)}>
              <X size={22} color={Colors.text} strokeWidth={2.5} />
            </TouchableOpacity>
          </View>

          <View style={styles.searchRow}>
            <Search size={16} color={Colors.textLight} strokeWidth={2} style={{ marginRight: 8 }} />
            <Input
              value={search}
              onChangeText={setSearch}
              placeholder="Search by name or address…"
              style={styles.searchInput}
            />
          </View>

          {hospitalsLoading ? (
            <ActivityIndicator color={Colors.primary} style={{ marginTop: 32 }} />
          ) : (
            <FlatList
              data={filtered}
              keyExtractor={(h) => h.id}
              contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32 }}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.hospitalItem,
                    selectedHospital?.id === item.id && styles.hospitalItemActive,
                  ]}
                  onPress={() => handleSelect(item)}
                >
                  <Building2
                    size={18}
                    color={
                      selectedHospital?.id === item.id ? Colors.primary : Colors.textSecondary
                    }
                    strokeWidth={2}
                    style={{ marginRight: 10 }}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.hospitalName}>{item.name}</Text>
                    <Text style={styles.hospitalAddress} numberOfLines={1}>
                      {item.address}
                    </Text>
                  </View>
                  {selectedHospital?.id === item.id && (
                    <CheckCircle size={18} color={Colors.primary} strokeWidth={2.5} />
                  )}
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <Text style={styles.emptyText}>No hospitals found.</Text>
              }
            />
          )}
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.white,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    ...crossPlatformShadow({ color: Colors.shadow, offsetY: 2, opacity: 1, radius: 8, elevation: 3 }),
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.text,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 6,
  },
  pickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.borderLight,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 16,
  },
  pickerSelected: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text,
  },
  pickerAddress: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  pickerPlaceholder: {
    flex: 1,
    fontSize: 14,
    color: Colors.textLight,
  },
  toggleCard: {
    marginBottom: 16,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  toggleLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
  },
  toggleSub: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  submitBtn: {
    marginTop: 8,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.text,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  searchInput: {
    flex: 1,
    marginBottom: 0,
  },
  hospitalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 14,
    marginTop: 8,
    borderWidth: 1.5,
    borderColor: Colors.borderLight,
  },
  hospitalItemActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
  },
  hospitalName: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
  },
  hospitalAddress: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 32,
  },
});
