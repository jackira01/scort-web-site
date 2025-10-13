'use client';

import { Menu, User, Receipt, Tags, Newspaper } from 'lucide-react';
import { motion } from 'motion/react';
import { sidebarItems } from '../data';

interface AccountHorizontalMenuProps {
  activeSection: string;
  setActiveSection: (id: string) => void;
  onToggleMenu: () => void;
  isVisible: boolean;
}

const AccountHorizontalMenu = ({
  activeSection,
  setActiveSection,
  onToggleMenu,
  isVisible,
}: AccountHorizontalMenuProps) => {

  const menuVariants = {
    hidden: {
      y: 100,
      opacity: 0,
    },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "tween",   // 👈 importante, evita el "spring"
        ease: "linear",  // 👈 velocidad constante (o prueba "easeInOut" si quieres más natural)
        duration: 0.4,
      },
    },
    exit: {
      y: 100,
      opacity: 0,
      transition: {
        duration: 0.2,
      },
    },
  };

  const iconVariants = {
    tap: {
      scale: 0.95,
      transition: {
        duration: 0.1,
      },
    },
  };

  if (!isVisible) return null;

  return (
    <motion.div
      variants={menuVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="fixed bottom-4 left-0 right-0 z-50 md:hidden flex justify-center"
    >
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 px-3 py-3">
        <div className="flex items-center justify-center space-x-3">
          {/* Botón de menú acordeón */}
          <motion.button
            variants={iconVariants}
            whileTap="tap"
            onClick={onToggleMenu}
            className="p-3 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg hover:shadow-xl transition-all duration-200"
          >
            <Menu className="h-5 w-5" />
          </motion.button>

          {/* Iconos de navegación */}
          {sidebarItems.map((item, index) => (
            <motion.button
              key={item.id}
              variants={iconVariants}
              whileTap="tap"
              onClick={() => setActiveSection(item.id)}
              className={`p-3 rounded-xl transition-all duration-200 ${activeSection === item.id
                ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                : 'text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              style={{
                animationDelay: `${(index + 1) * 50}ms`,
              }}
            >
              <item.icon className="h-5 w-5" />
            </motion.button>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

export default AccountHorizontalMenu;