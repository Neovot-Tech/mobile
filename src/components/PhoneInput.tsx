import React, { useMemo, useState } from 'react';
import { View, Text, TextInput, Pressable, Modal, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Colors, FontSize, MinTapTarget, Spacing, BorderRadius, Fonts } from '../theme';

export interface Country {
  code: string; // ISO 3166-1 alpha-2
  name: string;
  dial: string; // e.g. "+234"
  flag: string;
  example: string; // national-format example
}

// Ghana first (primary market), Nigeria second, then all countries alphabetically.
// US is listed before Canada so +1 auto-detects as US for unrecognised NANP numbers.
// Caribbean/NANP countries use their full prefix (+1242, +1876, etc.) so they detect
// correctly when sorted by dial length in the useMemo below.
export const COUNTRIES: Country[] = [
  { code: 'GH', name: 'Ghana', dial: '+233', flag: '🇬🇭', example: '20 865 2278' },
  { code: 'NG', name: 'Nigeria', dial: '+234', flag: '🇳🇬', example: '801 234 5678' },
  { code: 'AF', name: 'Afghanistan', dial: '+93', flag: '🇦🇫', example: '70 123 4567' },
  { code: 'AL', name: 'Albania', dial: '+355', flag: '🇦🇱', example: '66 123 4567' },
  { code: 'DZ', name: 'Algeria', dial: '+213', flag: '🇩🇿', example: '55 123 4567' },
  { code: 'AD', name: 'Andorra', dial: '+376', flag: '🇦🇩', example: '312 345' },
  { code: 'AO', name: 'Angola', dial: '+244', flag: '🇦🇴', example: '923 123 456' },
  { code: 'AG', name: 'Antigua & Barbuda', dial: '+1268', flag: '🇦🇬', example: '464 1234' },
  { code: 'AR', name: 'Argentina', dial: '+54', flag: '🇦🇷', example: '11 2345 6789' },
  { code: 'AM', name: 'Armenia', dial: '+374', flag: '🇦🇲', example: '77 123 456' },
  { code: 'AU', name: 'Australia', dial: '+61', flag: '🇦🇺', example: '412 345 678' },
  { code: 'AT', name: 'Austria', dial: '+43', flag: '🇦🇹', example: '664 123456' },
  { code: 'AZ', name: 'Azerbaijan', dial: '+994', flag: '🇦🇿', example: '40 123 4567' },
  { code: 'BS', name: 'Bahamas', dial: '+1242', flag: '🇧🇸', example: '359 1234' },
  { code: 'BH', name: 'Bahrain', dial: '+973', flag: '🇧🇭', example: '3600 1234' },
  { code: 'BD', name: 'Bangladesh', dial: '+880', flag: '🇧🇩', example: '1812 345678' },
  { code: 'BB', name: 'Barbados', dial: '+1246', flag: '🇧🇧', example: '250 1234' },
  { code: 'BY', name: 'Belarus', dial: '+375', flag: '🇧🇾', example: '29 123 4567' },
  { code: 'BE', name: 'Belgium', dial: '+32', flag: '🇧🇪', example: '470 12 34 56' },
  { code: 'BZ', name: 'Belize', dial: '+501', flag: '🇧🇿', example: '622 1234' },
  { code: 'BJ', name: 'Benin', dial: '+229', flag: '🇧🇯', example: '90 12 34 56' },
  { code: 'BT', name: 'Bhutan', dial: '+975', flag: '🇧🇹', example: '17 123 456' },
  { code: 'BO', name: 'Bolivia', dial: '+591', flag: '🇧🇴', example: '7 123 4567' },
  { code: 'BA', name: 'Bosnia & Herzegovina', dial: '+387', flag: '🇧🇦', example: '61 123 456' },
  { code: 'BW', name: 'Botswana', dial: '+267', flag: '🇧🇼', example: '71 123 456' },
  { code: 'BR', name: 'Brazil', dial: '+55', flag: '🇧🇷', example: '11 91234 5678' },
  { code: 'BN', name: 'Brunei', dial: '+673', flag: '🇧🇳', example: '712 3456' },
  { code: 'BG', name: 'Bulgaria', dial: '+359', flag: '🇧🇬', example: '87 123 4567' },
  { code: 'BF', name: 'Burkina Faso', dial: '+226', flag: '🇧🇫', example: '70 12 34 56' },
  { code: 'BI', name: 'Burundi', dial: '+257', flag: '🇧🇮', example: '79 56 12 34' },
  { code: 'CV', name: 'Cape Verde', dial: '+238', flag: '🇨🇻', example: '991 12 34' },
  { code: 'KH', name: 'Cambodia', dial: '+855', flag: '🇰🇭', example: '91 234 567' },
  { code: 'CM', name: 'Cameroon', dial: '+237', flag: '🇨🇲', example: '6 71 23 45 67' },
  { code: 'CF', name: 'Central African Republic', dial: '+236', flag: '🇨🇫', example: '70 01 23 45' },
  { code: 'TD', name: 'Chad', dial: '+235', flag: '🇹🇩', example: '63 01 23 45' },
  { code: 'CL', name: 'Chile', dial: '+56', flag: '🇨🇱', example: '9 1234 5678' },
  { code: 'CN', name: 'China', dial: '+86', flag: '🇨🇳', example: '131 2345 6789' },
  { code: 'CO', name: 'Colombia', dial: '+57', flag: '🇨🇴', example: '300 123 4567' },
  { code: 'KM', name: 'Comoros', dial: '+269', flag: '🇰🇲', example: '321 23 45' },
  { code: 'CG', name: 'Congo (Republic)', dial: '+242', flag: '🇨🇬', example: '06 123 4567' },
  { code: 'CD', name: 'Congo (DR)', dial: '+243', flag: '🇨🇩', example: '99 123 4567' },
  { code: 'CR', name: 'Costa Rica', dial: '+506', flag: '🇨🇷', example: '8312 3456' },
  { code: 'HR', name: 'Croatia', dial: '+385', flag: '🇭🇷', example: '91 234 5678' },
  { code: 'CU', name: 'Cuba', dial: '+53', flag: '🇨🇺', example: '5 1234 5678' },
  { code: 'CY', name: 'Cyprus', dial: '+357', flag: '🇨🇾', example: '96 123456' },
  { code: 'CZ', name: 'Czech Republic', dial: '+420', flag: '🇨🇿', example: '601 123 456' },
  { code: 'DK', name: 'Denmark', dial: '+45', flag: '🇩🇰', example: '32 12 34 56' },
  { code: 'DJ', name: 'Djibouti', dial: '+253', flag: '🇩🇯', example: '77 83 10 01' },
  { code: 'DM', name: 'Dominica', dial: '+1767', flag: '🇩🇲', example: '225 1234' },
  { code: 'DO', name: 'Dominican Republic', dial: '+1809', flag: '🇩🇴', example: '234 5678' },
  { code: 'EC', name: 'Ecuador', dial: '+593', flag: '🇪🇨', example: '99 123 4567' },
  { code: 'EG', name: 'Egypt', dial: '+20', flag: '🇪🇬', example: '100 123 4567' },
  { code: 'SV', name: 'El Salvador', dial: '+503', flag: '🇸🇻', example: '7012 3456' },
  { code: 'GQ', name: 'Equatorial Guinea', dial: '+240', flag: '🇬🇶', example: '222 123 456' },
  { code: 'ER', name: 'Eritrea', dial: '+291', flag: '🇪🇷', example: '7 123 456' },
  { code: 'EE', name: 'Estonia', dial: '+372', flag: '🇪🇪', example: '5123 4567' },
  { code: 'SZ', name: 'Eswatini', dial: '+268', flag: '🇸🇿', example: '7612 3456' },
  { code: 'ET', name: 'Ethiopia', dial: '+251', flag: '🇪🇹', example: '91 123 4567' },
  { code: 'FJ', name: 'Fiji', dial: '+679', flag: '🇫🇯', example: '701 2345' },
  { code: 'FI', name: 'Finland', dial: '+358', flag: '🇫🇮', example: '41 2345678' },
  { code: 'FR', name: 'France', dial: '+33', flag: '🇫🇷', example: '6 12 34 56 78' },
  { code: 'GA', name: 'Gabon', dial: '+241', flag: '🇬🇦', example: '06 03 12 34' },
  { code: 'GM', name: 'Gambia', dial: '+220', flag: '🇬🇲', example: '301 2345' },
  { code: 'GE', name: 'Georgia', dial: '+995', flag: '🇬🇪', example: '555 12 34 56' },
  { code: 'DE', name: 'Germany', dial: '+49', flag: '🇩🇪', example: '151 23456789' },
  { code: 'GR', name: 'Greece', dial: '+30', flag: '🇬🇷', example: '691 234 5678' },
  { code: 'GD', name: 'Grenada', dial: '+1473', flag: '🇬🇩', example: '403 1234' },
  { code: 'GT', name: 'Guatemala', dial: '+502', flag: '🇬🇹', example: '5123 4567' },
  { code: 'GN', name: 'Guinea', dial: '+224', flag: '🇬🇳', example: '601 12 34 56' },
  { code: 'GW', name: 'Guinea-Bissau', dial: '+245', flag: '🇬🇼', example: '955 012 345' },
  { code: 'GY', name: 'Guyana', dial: '+592', flag: '🇬🇾', example: '609 1234' },
  { code: 'HT', name: 'Haiti', dial: '+509', flag: '🇭🇹', example: '34 10 1234' },
  { code: 'HN', name: 'Honduras', dial: '+504', flag: '🇭🇳', example: '9123 4567' },
  { code: 'HU', name: 'Hungary', dial: '+36', flag: '🇭🇺', example: '20 123 4567' },
  { code: 'IS', name: 'Iceland', dial: '+354', flag: '🇮🇸', example: '611 1234' },
  { code: 'IN', name: 'India', dial: '+91', flag: '🇮🇳', example: '81234 56789' },
  { code: 'ID', name: 'Indonesia', dial: '+62', flag: '🇮🇩', example: '812 3456 789' },
  { code: 'IR', name: 'Iran', dial: '+98', flag: '🇮🇷', example: '912 345 6789' },
  { code: 'IQ', name: 'Iraq', dial: '+964', flag: '🇮🇶', example: '791 234 5678' },
  { code: 'IE', name: 'Ireland', dial: '+353', flag: '🇮🇪', example: '85 123 4567' },
  { code: 'IL', name: 'Israel', dial: '+972', flag: '🇮🇱', example: '50 123 4567' },
  { code: 'IT', name: 'Italy', dial: '+39', flag: '🇮🇹', example: '312 345 6789' },
  { code: 'JM', name: 'Jamaica', dial: '+1876', flag: '🇯🇲', example: '210 1234' },
  { code: 'JP', name: 'Japan', dial: '+81', flag: '🇯🇵', example: '90 1234 5678' },
  { code: 'JO', name: 'Jordan', dial: '+962', flag: '🇯🇴', example: '7 9012 3456' },
  { code: 'KZ', name: 'Kazakhstan', dial: '+7', flag: '🇰🇿', example: '700 123 4567' },
  { code: 'KE', name: 'Kenya', dial: '+254', flag: '🇰🇪', example: '712 345 678' },
  { code: 'KI', name: 'Kiribati', dial: '+686', flag: '🇰🇮', example: '72001234' },
  { code: 'KW', name: 'Kuwait', dial: '+965', flag: '🇰🇼', example: '5001 2345' },
  { code: 'KG', name: 'Kyrgyzstan', dial: '+996', flag: '🇰🇬', example: '700 123 456' },
  { code: 'LA', name: 'Laos', dial: '+856', flag: '🇱🇦', example: '20 23 123 456' },
  { code: 'LV', name: 'Latvia', dial: '+371', flag: '🇱🇻', example: '21 234 567' },
  { code: 'LB', name: 'Lebanon', dial: '+961', flag: '🇱🇧', example: '71 123 456' },
  { code: 'LS', name: 'Lesotho', dial: '+266', flag: '🇱🇸', example: '5012 3456' },
  { code: 'LR', name: 'Liberia', dial: '+231', flag: '🇱🇷', example: '77 012 3456' },
  { code: 'LY', name: 'Libya', dial: '+218', flag: '🇱🇾', example: '91 234 5678' },
  { code: 'LI', name: 'Liechtenstein', dial: '+423', flag: '🇱🇮', example: '660 234 567' },
  { code: 'LT', name: 'Lithuania', dial: '+370', flag: '🇱🇹', example: '612 34567' },
  { code: 'LU', name: 'Luxembourg', dial: '+352', flag: '🇱🇺', example: '628 123 456' },
  { code: 'MG', name: 'Madagascar', dial: '+261', flag: '🇲🇬', example: '32 12 345 67' },
  { code: 'MW', name: 'Malawi', dial: '+265', flag: '🇲🇼', example: '991 23 45 67' },
  { code: 'MY', name: 'Malaysia', dial: '+60', flag: '🇲🇾', example: '12 345 6789' },
  { code: 'MV', name: 'Maldives', dial: '+960', flag: '🇲🇻', example: '771 2345' },
  { code: 'ML', name: 'Mali', dial: '+223', flag: '🇲🇱', example: '65 01 23 45' },
  { code: 'MT', name: 'Malta', dial: '+356', flag: '🇲🇹', example: '9696 1234' },
  { code: 'MH', name: 'Marshall Islands', dial: '+692', flag: '🇲🇭', example: '235 1234' },
  { code: 'MR', name: 'Mauritania', dial: '+222', flag: '🇲🇷', example: '22 12 34 56' },
  { code: 'MU', name: 'Mauritius', dial: '+230', flag: '🇲🇺', example: '5251 2345' },
  { code: 'MX', name: 'Mexico', dial: '+52', flag: '🇲🇽', example: '222 123 4567' },
  { code: 'FM', name: 'Micronesia', dial: '+691', flag: '🇫🇲', example: '350 1234' },
  { code: 'MD', name: 'Moldova', dial: '+373', flag: '🇲🇩', example: '621 12 345' },
  { code: 'MC', name: 'Monaco', dial: '+377', flag: '🇲🇨', example: '6 12 34 56 78' },
  { code: 'MN', name: 'Mongolia', dial: '+976', flag: '🇲🇳', example: '8812 3456' },
  { code: 'ME', name: 'Montenegro', dial: '+382', flag: '🇲🇪', example: '67 622 901' },
  { code: 'MA', name: 'Morocco', dial: '+212', flag: '🇲🇦', example: '650 123456' },
  { code: 'MZ', name: 'Mozambique', dial: '+258', flag: '🇲🇿', example: '82 123 4567' },
  { code: 'MM', name: 'Myanmar', dial: '+95', flag: '🇲🇲', example: '9 212 3456' },
  { code: 'NA', name: 'Namibia', dial: '+264', flag: '🇳🇦', example: '81 123 4567' },
  { code: 'NR', name: 'Nauru', dial: '+674', flag: '🇳🇷', example: '555 1234' },
  { code: 'NP', name: 'Nepal', dial: '+977', flag: '🇳🇵', example: '984 123 4567' },
  { code: 'NL', name: 'Netherlands', dial: '+31', flag: '🇳🇱', example: '6 12345678' },
  { code: 'NZ', name: 'New Zealand', dial: '+64', flag: '🇳🇿', example: '21 123 4567' },
  { code: 'NI', name: 'Nicaragua', dial: '+505', flag: '🇳🇮', example: '8123 4567' },
  { code: 'NE', name: 'Niger', dial: '+227', flag: '🇳🇪', example: '93 12 34 56' },
  { code: 'MK', name: 'North Macedonia', dial: '+389', flag: '🇲🇰', example: '72 345 678' },
  { code: 'NO', name: 'Norway', dial: '+47', flag: '🇳🇴', example: '41 23 45 67' },
  { code: 'OM', name: 'Oman', dial: '+968', flag: '🇴🇲', example: '9212 3456' },
  { code: 'PK', name: 'Pakistan', dial: '+92', flag: '🇵🇰', example: '301 2345678' },
  { code: 'PW', name: 'Palau', dial: '+680', flag: '🇵🇼', example: '620 1234' },
  { code: 'PS', name: 'Palestine', dial: '+970', flag: '🇵🇸', example: '59 234 5678' },
  { code: 'PA', name: 'Panama', dial: '+507', flag: '🇵🇦', example: '6123 4567' },
  { code: 'PG', name: 'Papua New Guinea', dial: '+675', flag: '🇵🇬', example: '7012 3456' },
  { code: 'PY', name: 'Paraguay', dial: '+595', flag: '🇵🇾', example: '961 456789' },
  { code: 'PE', name: 'Peru', dial: '+51', flag: '🇵🇪', example: '912 345 678' },
  { code: 'PH', name: 'Philippines', dial: '+63', flag: '🇵🇭', example: '905 123 4567' },
  { code: 'PL', name: 'Poland', dial: '+48', flag: '🇵🇱', example: '512 345 678' },
  { code: 'PT', name: 'Portugal', dial: '+351', flag: '🇵🇹', example: '912 345 678' },
  { code: 'QA', name: 'Qatar', dial: '+974', flag: '🇶🇦', example: '3312 3456' },
  { code: 'RO', name: 'Romania', dial: '+40', flag: '🇷🇴', example: '712 034 567' },
  { code: 'RU', name: 'Russia', dial: '+7', flag: '🇷🇺', example: '912 345 6789' },
  { code: 'RW', name: 'Rwanda', dial: '+250', flag: '🇷🇼', example: '788 123 456' },
  { code: 'KN', name: 'Saint Kitts & Nevis', dial: '+1869', flag: '🇰🇳', example: '765 1234' },
  { code: 'LC', name: 'Saint Lucia', dial: '+1758', flag: '🇱🇨', example: '284 5678' },
  { code: 'VC', name: 'Saint Vincent', dial: '+1784', flag: '🇻🇨', example: '430 1234' },
  { code: 'WS', name: 'Samoa', dial: '+685', flag: '🇼🇸', example: '601 234' },
  { code: 'ST', name: 'São Tomé & Príncipe', dial: '+239', flag: '🇸🇹', example: '981 2345' },
  { code: 'SA', name: 'Saudi Arabia', dial: '+966', flag: '🇸🇦', example: '51 234 5678' },
  { code: 'SN', name: 'Senegal', dial: '+221', flag: '🇸🇳', example: '77 123 45 67' },
  { code: 'RS', name: 'Serbia', dial: '+381', flag: '🇷🇸', example: '60 1234567' },
  { code: 'SC', name: 'Seychelles', dial: '+248', flag: '🇸🇨', example: '2510 123' },
  { code: 'SL', name: 'Sierra Leone', dial: '+232', flag: '🇸🇱', example: '25 123456' },
  { code: 'SG', name: 'Singapore', dial: '+65', flag: '🇸🇬', example: '8123 4567' },
  { code: 'SK', name: 'Slovakia', dial: '+421', flag: '🇸🇰', example: '912 123 456' },
  { code: 'SI', name: 'Slovenia', dial: '+386', flag: '🇸🇮', example: '31 234 567' },
  { code: 'SB', name: 'Solomon Islands', dial: '+677', flag: '🇸🇧', example: '74 21234' },
  { code: 'SO', name: 'Somalia', dial: '+252', flag: '🇸🇴', example: '7 1123 456' },
  { code: 'ZA', name: 'South Africa', dial: '+27', flag: '🇿🇦', example: '71 234 5678' },
  { code: 'KR', name: 'South Korea', dial: '+82', flag: '🇰🇷', example: '10 1234 5678' },
  { code: 'SS', name: 'South Sudan', dial: '+211', flag: '🇸🇸', example: '977 123 456' },
  { code: 'ES', name: 'Spain', dial: '+34', flag: '🇪🇸', example: '612 34 56 78' },
  { code: 'LK', name: 'Sri Lanka', dial: '+94', flag: '🇱🇰', example: '71 234 5678' },
  { code: 'SD', name: 'Sudan', dial: '+249', flag: '🇸🇩', example: '91 123 1234' },
  { code: 'SR', name: 'Suriname', dial: '+597', flag: '🇸🇷', example: '741 2345' },
  { code: 'SE', name: 'Sweden', dial: '+46', flag: '🇸🇪', example: '70 123 45 67' },
  { code: 'CH', name: 'Switzerland', dial: '+41', flag: '🇨🇭', example: '78 123 45 67' },
  { code: 'SY', name: 'Syria', dial: '+963', flag: '🇸🇾', example: '944 567 890' },
  { code: 'TW', name: 'Taiwan', dial: '+886', flag: '🇹🇼', example: '912 345 678' },
  { code: 'TJ', name: 'Tajikistan', dial: '+992', flag: '🇹🇯', example: '37 012 3456' },
  { code: 'TZ', name: 'Tanzania', dial: '+255', flag: '🇹🇿', example: '621 234 567' },
  { code: 'TH', name: 'Thailand', dial: '+66', flag: '🇹🇭', example: '81 234 5678' },
  { code: 'TL', name: 'Timor-Leste', dial: '+670', flag: '🇹🇱', example: '7721 2345' },
  { code: 'TG', name: 'Togo', dial: '+228', flag: '🇹🇬', example: '90 11 23 45' },
  { code: 'TO', name: 'Tonga', dial: '+676', flag: '🇹🇴', example: '771 5123' },
  { code: 'TT', name: 'Trinidad & Tobago', dial: '+1868', flag: '🇹🇹', example: '291 1234' },
  { code: 'TN', name: 'Tunisia', dial: '+216', flag: '🇹🇳', example: '20 123 456' },
  { code: 'TR', name: 'Turkey', dial: '+90', flag: '🇹🇷', example: '501 234 5678' },
  { code: 'TM', name: 'Turkmenistan', dial: '+993', flag: '🇹🇲', example: '66 123456' },
  { code: 'TV', name: 'Tuvalu', dial: '+688', flag: '🇹🇻', example: '901 234' },
  { code: 'UG', name: 'Uganda', dial: '+256', flag: '🇺🇬', example: '712 345 678' },
  { code: 'UA', name: 'Ukraine', dial: '+380', flag: '🇺🇦', example: '50 123 4567' },
  { code: 'AE', name: 'United Arab Emirates', dial: '+971', flag: '🇦🇪', example: '50 123 4567' },
  { code: 'GB', name: 'United Kingdom', dial: '+44', flag: '🇬🇧', example: '7400 123456' },
  { code: 'US', name: 'United States', dial: '+1', flag: '🇺🇸', example: '201 555 0123' },
  { code: 'CA', name: 'Canada', dial: '+1', flag: '🇨🇦', example: '506 234 5678' },
  { code: 'UY', name: 'Uruguay', dial: '+598', flag: '🇺🇾', example: '94 231 234' },
  { code: 'UZ', name: 'Uzbekistan', dial: '+998', flag: '🇺🇿', example: '91 234 56 78' },
  { code: 'VU', name: 'Vanuatu', dial: '+678', flag: '🇻🇺', example: '591 2345' },
  { code: 'VE', name: 'Venezuela', dial: '+58', flag: '🇻🇪', example: '412 1234567' },
  { code: 'VN', name: 'Vietnam', dial: '+84', flag: '🇻🇳', example: '91 234 56 78' },
  { code: 'YE', name: 'Yemen', dial: '+967', flag: '🇾🇪', example: '712 345 678' },
  { code: 'ZM', name: 'Zambia', dial: '+260', flag: '🇿🇲', example: '97 1234567' },
  { code: 'ZW', name: 'Zimbabwe', dial: '+263', flag: '🇿🇼', example: '71 234 5678' },
];

const DEFAULT_COUNTRY = COUNTRIES[0]; // Ghana

// Sorted once at module load — longer dial codes checked first so e.g. +1876
// (Jamaica) is matched before +1 (USA) when auto-detecting from an E.164 string.
const COUNTRIES_BY_DIAL_LENGTH = [...COUNTRIES].sort((a, b) => b.dial.length - a.dial.length);

/** Strip everything but digits. */
const digitsOnly = (s: string) => s.replace(/[^\d]/g, '');

interface PhoneInputProps {
  /** Full E.164 value, e.g. "+233208652278". */
  value: string;
  onChangeText: (e164: string) => void;
  label?: string;
  /** Review / OTP confirmation mode: non-editable, shows flag beside dial code. */
  readOnly?: boolean;
}

export default function PhoneInput({ value, onChangeText, label, readOnly }: PhoneInputProps) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [pickerOpen, setPickerOpen] = useState(false);

  const { country, national } = useMemo(() => {
    const match = COUNTRIES_BY_DIAL_LENGTH.find((c) => value.startsWith(c.dial));
    if (match) return { country: match, national: value.slice(match.dial.length) };
    return { country: DEFAULT_COUNTRY, national: digitsOnly(value) };
  }, [value]);

  const emit = (nextCountry: Country, nextNational: string) =>
    onChangeText(`${nextCountry.dial}${digitsOnly(nextNational)}`);

  if (readOnly) {
    return (
      <View style={styles.wrap}>
        {label ? <Text style={styles.label}>{label}</Text> : null}
        <View style={[styles.row, styles.rowReadOnly]}>
          <View style={styles.flagBox}>
            <Text style={styles.flag}>{country.flag}</Text>
            <Text style={styles.dial}>{country.dial}</Text>
          </View>
          <View style={styles.divider} />
          <Text style={[styles.input, styles.inputReadOnly]}>{national}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View style={styles.row}>
        <Pressable
          style={styles.flagBox}
          onPress={() => setPickerOpen(true)}
          accessibilityRole="button"
          accessibilityLabel={`${country.name} (${country.dial})`}
        >
          <Text style={styles.flag}>{country.flag}</Text>
          <Text style={styles.dial}>{country.dial}</Text>
          <Text style={styles.chevron}>⌄</Text>
        </Pressable>
        <View style={styles.divider} />
        <TextInput
          value={national}
          onChangeText={(text) => emit(country, text)}
          keyboardType="phone-pad"
          placeholder={country.example}
          placeholderTextColor={Colors.textMuted}
          style={styles.input}
          accessibilityLabel={label ?? t('auth.phonePlaceholder')}
        />
      </View>

      <Modal visible={pickerOpen} transparent animationType="slide" onRequestClose={() => setPickerOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setPickerOpen(false)}>
          <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, Spacing.lg) }]}>
            <View style={styles.handle} />
            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {COUNTRIES.map((c) => {
                const active = c.code === country.code;
                return (
                  <Pressable
                    key={c.code}
                    style={({ pressed }) => [styles.option, pressed && styles.optionPressed]}
                    onPress={() => {
                      emit(c, national);
                      setPickerOpen(false);
                    }}
                    accessibilityRole="button"
                  >
                    <Text style={styles.optionFlag}>{c.flag}</Text>
                    <Text style={styles.optionName}>{c.name}</Text>
                    <Text style={styles.optionDial}>{c.dial}</Text>
                    {active ? <Text style={styles.optionCheck}>✓</Text> : null}
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: Spacing.lg },
  label: {
    color: Colors.textPrimary,
    fontSize: FontSize.sm,
    fontWeight: '700',
    marginBottom: Spacing.sm,
  },
  row: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: Colors.primary,
    borderRadius: 10,
    backgroundColor: Colors.surface,
    minHeight: MinTapTarget.neoSenior,
    alignItems: 'center',
  },
  rowReadOnly: {
    borderColor: Colors.border,
    backgroundColor: Colors.background ?? Colors.surface,
    opacity: 0.75,
  },
  flagBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    alignSelf: 'stretch',
    gap: 4,
  },
  divider: {
    width: 1,
    alignSelf: 'stretch',
    backgroundColor: Colors.border,
  },
  flag: { fontSize: FontSize.lg },
  dial: { fontFamily: Fonts.bodyMedium, fontSize: FontSize.base, color: Colors.textPrimary },
  chevron: { color: Colors.textMuted, fontSize: FontSize.sm, marginTop: -6 },
  input: {
    flex: 1,
    paddingHorizontal: Spacing.base,
    fontSize: FontSize.base,
    color: Colors.textPrimary,
    minHeight: MinTapTarget.neoSenior,
  },
  inputReadOnly: {
    paddingVertical: Spacing.md,
  },

  backdrop: { flex: 1, backgroundColor: Colors.overlay, justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
    maxHeight: '70%',
  },
  handle: {
    alignSelf: 'center',
    width: 44,
    height: 5,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.border,
    marginBottom: Spacing.md,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: MinTapTarget.neoSenior,
    gap: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  optionPressed: { opacity: 0.6 },
  optionFlag: { fontSize: FontSize.xl },
  optionName: { flex: 1, fontFamily: Fonts.bodyMedium, fontSize: FontSize.base, color: Colors.textPrimary },
  optionDial: { fontFamily: Fonts.body, fontSize: FontSize.base, color: Colors.textSecondary },
  optionCheck: { fontSize: FontSize.base, color: Colors.primary, fontWeight: '700' },
});
