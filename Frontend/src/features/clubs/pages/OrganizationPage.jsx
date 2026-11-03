import React from 'react';
import FeaturePage from '../../../components/common/FeaturePage.jsx';
import {createResourceService} from '../../../services/resourceService.js';
import config from '../module.js';
const service=createResourceService(config);
export default function OrganizationPage(){return <FeaturePage config={config} service={service}/>;}
