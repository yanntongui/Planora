
import React from 'react';
import BriefcaseIcon from '../components/icons/BriefcaseIcon';
import CarIcon from '../components/icons/CarIcon';
import ClapperboardIcon from '../components/icons/ClapperboardIcon';
import HeartPulseIcon from '../components/icons/HeartPulseIcon';
import HomeIcon from '../components/icons/HomeIcon';
import ReceiptIcon from '../components/icons/ReceiptIcon';
import ShoppingBagIcon from '../components/icons/ShoppingBagIcon';
import UtensilsIcon from '../components/icons/UtensilsIcon';

const categoryIcons: { [key: string]: React.FC<{ className?: string }> } = {
  foodAndDining: UtensilsIcon,
  transport: CarIcon,
  shopping: ShoppingBagIcon,
  entertainment: ClapperboardIcon,
  billsAndUtilities: HomeIcon,
  health: HeartPulseIcon,
  income: BriefcaseIcon,
  general: ReceiptIcon,
};

export const getCategoryIcon = (category: string): React.FC<{ className?: string }> => {
  return categoryIcons[category] || ReceiptIcon;
};
