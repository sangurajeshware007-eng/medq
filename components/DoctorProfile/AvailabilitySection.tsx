import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { format, addDays, isSameDay } from 'date-fns';
import { Colors } from '../../constants/Colors';
import { getSlotsForDate, getNextAvailableSlot, DoctorSlot } from '../../utils/doctorUtils';
import { Calendar, ChevronRight, ArrowRight } from 'lucide-react-native';

interface AvailabilitySectionProps {
  sessions: any[];
  onSlotSelect: (date: Date, slot: DoctorSlot) => void;
}

export default function AvailabilitySection({ sessions, onSlotSelect }: AvailabilitySectionProps) {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const dates = Array.from({ length: 7 }, (_, i) => addDays(new Date(), i));
  const slots = getSlotsForDate(sessions, selectedDate);
  const nextSlot = getNextAvailableSlot(sessions);

  // Divide slots into Morning, Afternoon, Evening
  const morningSlots = slots.filter(s => s.time < '12:00');
  const afternoonSlots = slots.filter(s => s.time >= '12:00' && s.time < '17:00');
  const eveningSlots = slots.filter(s => s.time >= '17:00');

  const renderSlotGroup = (title: string, group: DoctorSlot[]) => (
    group.length > 0 ? (
      <View style={styles.slotGroup}>
        <Text style={styles.groupTitle}>{title}</Text>
        <View style={styles.slotsGrid}>
          {group.map((slot, i) => (
            <TouchableOpacity 
              key={i} 
              style={styles.slotChip} 
              onPress={() => onSlotSelect(selectedDate, slot)}
            >
              <Text style={styles.slotText}>{slot.time}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    ) : null
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTitleRow}>
          <Calendar size={18} color={Colors.primary} strokeWidth={2.5} />
          <Text style={styles.sectionTitle}>Availability</Text>
        </View>
        <TouchableOpacity style={styles.viewAllBtn}>
          <Text style={styles.viewAllText}>Full Schedule</Text>
          <ChevronRight size={14} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Next Available Banner */}
      {nextSlot && (
        <View style={styles.nextAvailableBanner}>
          <View style={styles.nextContent}>
            <Text style={styles.nextLabel}>Next Available Slot</Text>
            <Text style={styles.nextValue}>
              {format(nextSlot.date, 'eee, MMM dd')} at {nextSlot.slot.time}
            </Text>
          </View>
          <TouchableOpacity 
            style={styles.nextButton}
            onPress={() => {
              setSelectedDate(nextSlot.date);
              onSlotSelect(nextSlot.date, nextSlot.slot);
            }}
          >
            <Text style={styles.nextBtnText}>Book Now</Text>
            <ArrowRight size={14} color={Colors.white} />
          </TouchableOpacity>
        </View>
      )}

      {/* Date Selector */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false} 
        contentContainerStyle={styles.dateSelector}
      >
        {dates.map((date, i) => {
          const isSelected = isSameDay(date, selectedDate);
          return (
            <TouchableOpacity 
              key={i} 
              style={[styles.dateCard, isSelected && styles.dateCardActive]}
              onPress={() => setSelectedDate(date)}
            >
              <Text style={[styles.dayName, isSelected && styles.dayNameActive]}>
                {i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : format(date, 'eee')}
              </Text>
              <Text style={[styles.dayNumber, isSelected && styles.dayNumberActive]}>
                {format(date, 'dd')}
              </Text>
              <View style={[styles.indicator, isSelected && styles.indicatorActive]} />
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Slots */}
      <View style={styles.slotsContainer}>
        {slots.length > 0 ? (
          <>
            {renderSlotGroup('Morning', morningSlots)}
            {renderSlotGroup('Afternoon', afternoonSlots)}
            {renderSlotGroup('Evening', eveningSlots)}
          </>
        ) : (
          <View style={styles.noSlots}>
            <Text style={styles.noSlotsText}>No slots available for this day.</Text>
            <TouchableOpacity onPress={() => nextSlot && setSelectedDate(nextSlot.date)}>
              <Text style={styles.suggestNext}>See next available</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.white,
    paddingVertical: 20,
    borderRadius: 24,
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.text,
  },
  viewAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  viewAllText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.primary,
  },
  nextAvailableBanner: {
    backgroundColor: Colors.primaryLight,
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: Colors.primary + '15',
    marginBottom: 20,
  },
  nextContent: {
    gap: 2,
  },
  nextLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.primary,
    textTransform: 'uppercase',
  },
  nextValue: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.text,
  },
  nextButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  nextBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.white,
  },
  dateSelector: {
    paddingHorizontal: 20,
    marginBottom: 20,
    gap: 12,
  },
  dateCard: {
    width: 65,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  dateCardActive: {
    backgroundColor: Colors.white,
    borderColor: Colors.primary,
  },
  dayName: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textLight,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  dayNameActive: {
    color: Colors.primary,
  },
  dayNumber: {
    fontSize: 18,
    fontWeight: '900',
    color: Colors.text,
  },
  dayNumberActive: {
    color: Colors.primary,
  },
  indicator: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'transparent',
    marginTop: 6,
  },
  indicatorActive: {
    backgroundColor: Colors.primary,
  },
  slotsContainer: {
    paddingHorizontal: 20,
  },
  slotGroup: {
    marginBottom: 16,
  },
  groupTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.textSecondary,
    marginBottom: 10,
    textTransform: 'uppercase',
  },
  slotsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  slotChip: {
    backgroundColor: Colors.white,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    minWidth: 75,
    alignItems: 'center',
  },
  slotText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
  },
  noSlots: {
    alignItems: 'center',
    paddingVertical: 32,
    gap: 8,
  },
  noSlotsText: {
    fontSize: 14,
    color: Colors.textLight,
  },
  suggestNext: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.primary,
  },
});
