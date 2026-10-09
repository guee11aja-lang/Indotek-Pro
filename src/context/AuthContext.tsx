import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import {
  User as FirebaseUser,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  GoogleAuthProvider
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from '../lib/firebase';
import { UserProfile } from '../types';

import { AppRole, AppModule, AppAction, RolePermissions } from '../types/rbac';
import {
  ROLE_DEFINITIONS,
  canRolePerform,
  hasApprovalAuthority,
  isUserAssignedToProject
} from '../lib/rbac';

interface AuthContextType {
  currentUser: FirebaseUser | null;
  userProfile: UserProfile | null;
  isLoading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOutUser: () => Promise<void>;
  isLoginModalOpen: boolean;
  setIsLoginModalOpen: (open: boolean) => void;
  isAdmin: boolean;
  // RBAC & Governance
  activeRole: AppRole;
  setActiveRole: (role: AppRole) => void;
  hasRolePermission: (module: AppModule, action: AppAction) => boolean;
  hasAuthority: (authority: keyof RolePermissions['approvalAuthorities']) => boolean;
  canAccessProject: (projectIdOrName: string) => boolean;
  assignedProjects: string[];
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [activeRole, setActiveRole] = useState<AppRole>('Owner / Director');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        try {
          const userDocRef = doc(db, 'users', user.uid);
          const userDocSnap = await getDoc(userDocRef);

          if (userDocSnap.exists()) {
            const data = userDocSnap.data() as UserProfile;
            setUserProfile(data);
            if (data.role && (data.role as AppRole) in ROLE_DEFINITIONS) {
              setActiveRole(data.role as AppRole);
            }
          } else {
            // Initialize new user profile
            const isDefaultAdmin = user.email === 'guee11aja@gmail.com' || user.email === 'gue11azaa@gmail.com';
            const initialRole: AppRole = isDefaultAdmin ? 'Owner / Director' : 'Site Manager / Supervisor';
            const newProfile: UserProfile = {
              uid: user.uid,
              name: user.displayName || (isDefaultAdmin ? 'Ir. Bambang Sujarwo, IPU' : 'Budi Santoso, S.T.'),
              email: user.email || '',
              role: initialRole,
              department: isDefaultAdmin ? 'Direksi & Eksekutif' : 'Rekayasa Lapangan',
              nip: 'IND-2026-' + user.uid.substring(0, 4).toUpperCase(),
              workspaceId: 'indotek-jkt',
              assignedProjects: ['Menara Nusantara Office & Mixed-Use', 'Jembatan Layang Pasteur Interchange'],
              status: 'Aktif',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };

            await setDoc(userDocRef, newProfile);
            setUserProfile(newProfile);
            setActiveRole(initialRole);

            // Register admin if default email
            if (isDefaultAdmin) {
              const adminDocRef = doc(db, 'admins', user.uid);
              await setDoc(adminDocRef, {
                uid: user.uid,
                email: user.email,
                grantedAt: serverTimestamp(),
              });
            }
          }
        } catch (err) {
          console.error('Error fetching/syncing user profile:', err);
        }
      } else {
        setUserProfile(null);
        setActiveRole('Owner / Director');
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      await signInWithPopup(auth, provider);
      setIsLoginModalOpen(false);
    } catch (error: any) {
      if (error?.code !== 'auth/popup-closed-by-user') {
        console.error('Error signing in with Google:', error);
      }
      throw error;
    }
  };

  const signOutUser = async () => {
    try {
      await signOut(auth);
      setUserProfile(null);
      setActiveRole('Owner / Director');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const isAdmin = Boolean(
    currentUser && (
      currentUser.email === 'guee11aja@gmail.com' ||
      currentUser.email === 'gue11azaa@gmail.com' ||
      activeRole === 'Owner / Director'
    )
  );

  const assignedProjects = userProfile?.assignedProjects || [
    'Menara Nusantara Office & Mixed-Use',
    'Jembatan Layang Pasteur Interchange',
    'Cluster Perumahan Griya Asri BSD Fase 2',
    'Gudang Logistik & Cold Storage Rungkut'
  ];

  const hasRolePermission = (module: AppModule, action: AppAction): boolean => {
    return canRolePerform(activeRole, module, action);
  };

  const hasAuthority = (authority: keyof RolePermissions['approvalAuthorities']): boolean => {
    return hasApprovalAuthority(activeRole, authority);
  };

  const canAccessProject = (projectIdOrName: string): boolean => {
    return isUserAssignedToProject(activeRole, assignedProjects, projectIdOrName);
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        userProfile,
        isLoading,
        signInWithGoogle,
        signOutUser,
        isLoginModalOpen,
        setIsLoginModalOpen,
        isAdmin,
        activeRole,
        setActiveRole,
        hasRolePermission,
        hasAuthority,
        canAccessProject,
        assignedProjects,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
