// Finances — page parente de « Mes finances » (/finances/mes-finances) et « Mon compte »
// (/finances/compte). /finances seul redirige vers Mes finances.
import React from 'react';
import { Outlet, useLocation, Navigate, useOutletContext } from 'react-router-dom';
import { ROUTES } from '@/utils/url/frontend';

const Finances = () => {
  const { pathname } = useLocation();
  // Transmis aux sous-pages : accès du compte (plan…) donné par la mise en page
  const contexte = useOutletContext();
  if (pathname.replace(/\/$/, '') === ROUTES.finances) return <Navigate to={ROUTES.mesFinances} replace />;
  return <Outlet context={contexte} />;
};

export default Finances;
