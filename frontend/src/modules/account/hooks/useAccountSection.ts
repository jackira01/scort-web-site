import { useState } from 'react';

export function useAccountSection(defaultSection = 'perfiles') {
  const [activeSection, setActiveSection] = useState(defaultSection);
  return { activeSection, setActiveSection };
}
