// Finances — page parente de « Mes finances » (/finances/mes-finances) et « Mon compte »
// (/finances/compte). /finances seul redirige vers Mes finances.
import React from 'react';
import { Outlet, useLocation, Navigate } from 'react-router-dom';
import { ROUTES } from '@/utils/url/frontend';

const Finances = () => {
  const { pathname } = useLocation();
  if (pathname.replace(/\/$/, '') === ROUTES.finances) return <Navigate to={ROUTES.mesFinances} replace />;
  return <Outlet />;
};

export default Finances;
