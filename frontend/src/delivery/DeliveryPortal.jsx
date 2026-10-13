import React from 'react';
import {DriverAuthProvider} from './DriverAuthProvider';
import DriverDashboard from './DriverDashboard';
export default function DeliveryPortal(){return <DriverAuthProvider><DriverDashboard/></DriverAuthProvider>;}
