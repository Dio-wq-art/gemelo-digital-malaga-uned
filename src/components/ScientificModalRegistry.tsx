import React, { lazy, Suspense, useCallback, useMemo } from 'react';
import { AnimatePresence } from 'motion/react';
import { DraggableWindow } from './DraggableWindow';
import { SectionErrorBoundary } from './SectionErrorBoundary';
import { ScientificTooltip } from './ScientificTooltip';
import { Sparkles, ChevronRight } from 'lucide-react';
import { useActivePoint } from '../context/ActivePointContext';
import { OfficialStationsModal } from './OfficialStationsModal';
import { QuickModuleLauncherModal } from './QuickModuleLauncherModal';
import { FairmodeStatisticalMetricsModal } from './FairmodeStatisticalMetricsModal';
import { ThesisMethodologySuiteModal } from './ThesisMethodologySuiteModal';
import { FairDataExporterModal } from './FairDataExporterModal';
import { StationInstrumentalModal } from './StationInstrumentalModal';

// --- Normalizador Universal de Identificadores y Alias de Modales ---
export const normalizeModalId = (id: string | null): string => {
  if (!id) return '';
  const [baseId, subtab] = id.includes(':') ? id.split(':') : [id, undefined];
  const aliasMap: Record<string, string> = {
    // 21 Módulos del Explorador Integral (QuickModuleLauncher)
    liveIngestion: 'liveIngestion',
    live_ingestion: 'liveIngestion',
    stationInstrumental: 'stationInstrumental',
    station_instrumental: 'stationInstrumental',
    instrumentalStation: 'stationInstrumental',
    une_en_14211: 'stationInstrumental',
    audit: 'stationAudit',
    stationAudit: 'stationAudit',
    officialStations: 'stationAudit',
    official_stations: 'stationAudit',
    official_monitoring_network: 'stationAudit',
    observatorio: 'stationAudit',
    observatorio_estaciones: 'stationAudit',
    estaciones_satelites: 'stationAudit',
    activePoint7DayHistory: 'activePoint7DayHistory',
    active_point_7day_history: 'activePoint7DayHistory',
    pointAirQualityHistory: 'activePoint7DayHistory',
    point7DayHistory: 'activePoint7DayHistory',
    airQualityHistory7D: 'activePoint7DayHistory',
    pointHistory7D: 'activePoint7DayHistory',
    temporal_point_history_7d: 'activePoint7DayHistory',
    correlationScatterPlot: 'correlationScatterPlot',
    correlation_scatter_plot: 'correlationScatterPlot',
    correlationScatter: 'correlationScatterPlot',
    d3ScatterPlot: 'correlationScatterPlot',
    d3_scatter_plot: 'correlationScatterPlot',
    scatterCorrelation: 'correlationScatterPlot',
    metrologicalCertificate: 'metrologicalCertificate',
    metrological_certificate: 'metrologicalCertificate',
    'metrological-certificate': 'metrologicalCertificate',
    pointCertificate: 'metrologicalCertificate',
    point_certificate: 'metrologicalCertificate',
    'point-metrological-certificate': 'metrologicalCertificate',
    microscaleComparator: 'microscaleComparator',
    microscale_comparator: 'microscaleComparator',
    bipunctualComparator: 'microscaleComparator',
    bipunctual_comparator: 'microscaleComparator',
    camsBoundary: 'satelliteAssimilation',
    cams_boundary: 'satelliteAssimilation',
    satellite_cams: 'satelliteAssimilation',
    satelliteAssimilation: 'satelliteAssimilation',
    satellite_assimilation: 'satelliteAssimilation',
    tropomiIntercomparison: 'tropomiIntercomparison',
    tropomi_intercomparison: 'tropomiIntercomparison',
    satellite_tropomi: 'tropomiIntercomparison',
    unifiedCanyonSuite: 'unifiedCanyonSuite',
    unified_canyon_suite: 'unifiedCanyonSuite',
    googleMaps3DCanyon: 'googleMaps3DCanyon',
    google_maps_3d_canyon: 'googleMaps3DCanyon',
    juanXXIIICanyon3D: 'googleMaps3DCanyon',
    juan_xxiii: 'googleMaps3DCanyon',
    juanxxiii: 'googleMaps3DCanyon',
    verticalSounding: 'verticalCanyonSounding',
    vertical_sounding: 'verticalCanyonSounding',
    verticalCanyonSounding: 'verticalCanyonSounding',
    vertical_canyon_sounding: 'verticalCanyonSounding',
    boundaryLayerProfile: 'moninObukhov',
    boundary_layer_profile: 'moninObukhov',
    moninObukhov: 'moninObukhov',
    monin_obukhov: 'moninObukhov',
    monin_obukhov_stability: 'moninObukhov',
    urbanHeatIsland: 'urbanHeatIsland',
    urban_heat_island: 'urbanHeatIsland',
    urbanHeatIslandThermalBalance: 'urbanHeatIsland',
    extendedLeighton: 'leighton',
    extended_leighton: 'leighton',
    leighton: 'leighton',
    leighton_photostationary: 'leighton',
    copert: 'copert',
    copertTraffic: 'copert',
    copert_traffic: 'copert',
    copert_speed_emissions: 'copert',
    rline: 'rlineDispersionModal',
    rline_dispersion: 'rlineDispersionModal',
    coastalAtmosphericChemistry: 'q1CoastalChemistry',
    coastal_atmospheric_chemistry: 'q1CoastalChemistry',
    q1CoastalChemistry: 'q1CoastalChemistry',
    q1_coastal_chemistry: 'q1CoastalChemistry',
    coastal_halogen_clno2: 'q1CoastalChemistry',
    seaSaltNitrate: 'q1CoastalChemistry',
    sea_salt_nitrate: 'q1CoastalChemistry',
    marineNitratePartitioning: 'q1CoastalChemistry',
    marine_nitrate_partitioning: 'q1CoastalChemistry',
    isorropiaSeaSalt: 'q1CoastalChemistry',
    isorropia_sea_salt: 'q1CoastalChemistry',
    termodinamicaAerosolMarino: 'q1CoastalChemistry',
    termodinamica_aerosol_marino: 'q1CoastalChemistry',
    nitratoAerosolCostero: 'q1CoastalChemistry',
    nitrato_aerosol_costero: 'q1CoastalChemistry',
    q1Optimization: 'q1Optimization',
    q1_optimization: 'q1Optimization',
    adjoint_sensitivity: 'q1Optimization',
    malagaTreesInventory: 'malagaTreesInventory',
    malaga_trees_inventory: 'malagaTreesInventory',
    treeSpeciesConfig: 'malagaTreesInventory',
    weselyDeposition: 'weselyDryDeposition',
    wesely_deposition: 'weselyDryDeposition',
    wesely: 'weselyDryDeposition',
    wesely_dry_deposition: 'weselyDryDeposition',
    weselyDryDeposition: 'weselyDryDeposition',
    terralMicrophysics: 'weselyDryDeposition:microfisica_terral',
    terral_microphysics: 'weselyDryDeposition:microfisica_terral',
    terralGuadalhorce: 'weselyDryDeposition:microfisica_terral',
    terral_guadalhorce: 'weselyDryDeposition:microfisica_terral',
    terralWesely: 'weselyDryDeposition:microfisica_terral',
    terral: 'weselyDryDeposition:microfisica_terral',
    fairmodeValidation: 'fairmodeValidation',
    fairmode_validation: 'fairmodeValidation',
    fairmode: 'fairmodeValidation',
    stationValidator: 'fairmodeValidation',
    latexThesis: 'latexThesis',
    latex_thesis: 'latexThesis',
    latexThesisExporter: 'latexThesis',
    highResPdfReport: 'highResPdfReport',
    high_res_pdf_report: 'highResPdfReport',
    pdfReport: 'highResPdfReport',
    high_res_pdf: 'highResPdfReport',
    q1PaperMonograph: 'q1PaperMonograph',
    q1_paper_monograph: 'q1PaperMonograph',
    q1Paper: 'q1PaperMonograph',
    q1_paper: 'q1PaperMonograph',
    paperQ1: 'q1PaperMonograph',
    paper_q1: 'q1PaperMonograph',
    doctoralReportGuide: 'doctoralReportGuide',
    doctoral_report_guide: 'doctoralReportGuide',
    pdfReportGuide: 'doctoralReportGuide',
    pdf_report_guide: 'doctoralReportGuide',
    '12pagesGuide': 'doctoralReportGuide',
    guide12Pages: 'doctoralReportGuide',
    guia12Paginas: 'doctoralReportGuide',
    guia_12_paginas: 'doctoralReportGuide',
    fairDataExporter: 'fairDataExporter',
    fair_data_exporter: 'fairDataExporter',
    fair: 'fairDataExporter',
    FAIR: 'fairDataExporter',
    export: 'fairDataExporter',
    exportar: 'fairDataExporter',
    exportar_fair: 'fairDataExporter',
    exportarFair: 'fairDataExporter',
    exportacion_fair: 'fairDataExporter',
    exportacionFair: 'fairDataExporter',
    export_fair: 'fairDataExporter',
    customPdfReport: 'customPdfReport',
    custom_pdf_report: 'customPdfReport',
    customPdf: 'customPdfReport',
    custom_pdf: 'customPdfReport',
    estudioPdf: 'customPdfReport',
    estudio_pdf: 'customPdfReport',
    informe_a_la_carta: 'customPdfReport',
    FAIRMODE: 'fairmode',
    populationExposure: 'populationExposure',
    population_exposure: 'populationExposure',
    phdDefenseWalkthrough: 'phdDefenseWalkthrough',
    phd_defense_walkthrough: 'phdDefenseWalkthrough',
    defense: 'phdDefenseWalkthrough',
    tribunalDefenseAdvisor: 'tribunalDefenseAdvisor',
    tribunal_defense: 'tribunalDefenseAdvisor',
    eiduned_defense: 'tribunalDefenseAdvisor',

    // 21 Tópicos de la Ontología Físico-Química del Atlas
    canyon_vortex_recirculation: 'urbanCanyonDiagram',
    aerosol_multimodal_distribution: 'chemicalSpecies',
    coastal_sea_breeze_circulation: 'seaBreeze',
    aircraft_lto_kinetics: 'guadalhorceAirport',
    bvoc_isoprene_monoterpenes: 'treeBvocSoa',
    pinn_physics_informed_loss: 'benchmark',
    acute_episode_protocol: 'acuteEpisodeAlert',
    gum_uncertainty_budget: 'gumUncertainty',
    aod_optical_depth: 'spectralPhotolysis',
    wind_vector_advection: 'q1MicroscalePhysics',
    d3_advection_diffusion_contour: 'q1FrontiersSuite',
    orographic_dem_hillshade: 'thermalInversion',
    deckgl_gpu_instancing: 'deckGlInstancing',
    urban_canopy_lod1: 'canyonGeometryOsm',

    // Suites y Módulos de Soporte
    portHotellingEmissions: 'portEmissions',
    port_hotelling_emissions: 'portEmissions',
    port_emissions: 'portEmissions',
    portCruises: 'portEmissions',
    port_cruises: 'portEmissions',
    majorEmissionsSources: 'majorEmissionsSources',
    major_emissions_sources: 'majorEmissionsSources',
    macroEmisoresMalaga: 'majorEmissionsSources',
    macro_emisores_malaga: 'majorEmissionsSources',
    aranaCementPlant: 'majorEmissionsSources',
    arana_cement_plant: 'majorEmissionsSources',
    cementeraArana: 'majorEmissionsSources',
    cementera_arana: 'majorEmissionsSources',
    airportWesternImpact: 'majorEmissionsSources',
    airport_western_impact: 'majorEmissionsSources',
    vegetation: 'greenRoofMitigation',
    canyonGeometry: 'canyonGeometryOsm',
    canyon_geometry: 'canyonGeometryOsm',
    bvoc: 'treeBvocSoa',
    sobol: 'sobolSensitivity',
    w3cProv: 'w3cProvGraph',
    prov: 'w3cProvGraph',
    pinn_benchmark: 'benchmark',
    guide: 'userGuide',
    guia: 'userGuide',
    guía: 'userGuide',
    GUIA: 'userGuide',
    GUÍA: 'userGuide',
    userGuide: 'userGuide',
    user_guide: 'userGuide',
    guiaUsuario: 'userGuide',
    guia_usuario: 'userGuide',
    guiaMetodologica: 'userGuide',
    quick_launcher: 'quickLauncher',
    quickLauncher: 'quickLauncher',
    commandPalette: 'quickLauncher',
    commandHub: 'quickLauncher',
    alboranOceanography: 'alboranCruiseAirport',
    alboran_oceanography: 'alboranCruiseAirport',
    alboranSea: 'alboranCruiseAirport',
    alboran_sea: 'alboranCruiseAirport',
    alboranCruiseAirport: 'alboranCruiseAirport',
    alboran_cruise_airport: 'alboranCruiseAirport',
    cruisePlumeAirportControl: 'alboranCruiseAirport',
    cruise_plume_airport_control: 'alboranCruiseAirport',
    alboran_marine_currents: 'alboranCruiseAirport',
    alboran_currents_density: 'alboranCruiseAirport',
    trafficHotspots: 'traffic',
    traffic_hotspots: 'traffic',
    activePointAudioNarrator: 'activePointAudioNarrator',
    active_point_audio_narrator: 'activePointAudioNarrator',
    audioNarrator: 'activePointAudioNarrator',
    audio_narrator: 'activePointAudioNarrator',
    pointAudioNarrator: 'activePointAudioNarrator',
    audionarracionPuntoActivo: 'activePointAudioNarrator',
    audionarracion: 'activePointAudioNarrator',
    slideTribunal: 'slideTribunal',
    slide_tribunal: 'slideTribunal',
    doctoralSlide: 'slideTribunal',
    doctoral_slide: 'slideTribunal',
    slideDeTribunal: 'slideTribunal',
    vulnerableFacilitiesRisk: 'vulnerableFacilitiesRisk',
    vulnerable_facilities_risk: 'vulnerableFacilitiesRisk',
    vulnerableFacilities: 'vulnerableFacilitiesRisk',
    vulnerable_facilities: 'vulnerableFacilitiesRisk',
    irsvHeatmap: 'vulnerableFacilitiesRisk',
    irsv_heatmap: 'vulnerableFacilitiesRisk',
    irsvRisk: 'vulnerableFacilitiesRisk',
    hospitalSchoolRisk: 'vulnerableFacilitiesRisk',
    hospital_school_risk: 'vulnerableFacilitiesRisk',
    systemIntegrityAudit: 'systemIntegrityAudit',
    system_integrity_audit: 'systemIntegrityAudit',
    auditIntegrity: 'systemIntegrityAudit',
    integrityAudit: 'systemIntegrityAudit',
    verificacionSistemica: 'systemIntegrityAudit',
    verificacion_sistemica: 'systemIntegrityAudit',
    systemAudit: 'systemIntegrityAudit',
    telemetryProvenanceTracker: 'telemetryProvenanceTracker',
    telemetry_provenance_tracker: 'telemetryProvenanceTracker',
    telemetryProvenance: 'telemetryProvenanceTracker',
    provenanceTracker: 'telemetryProvenanceTracker',
    trazabilidadTelemetrica: 'telemetryProvenanceTracker',
    provenanceAudit: 'telemetryProvenanceTracker',
    no2MassBudget: 'no2MassBudget',
    no2_mass_budget: 'no2MassBudget',
    no2MassBudgetWaterfall: 'no2MassBudget',
    no2_mass_budget_waterfall: 'no2MassBudget',
    balanceMasaNo2: 'no2MassBudget',
    balance_masa_no2: 'no2MassBudget',
    no2Waterfall: 'no2MassBudget',
    no2_waterfall: 'no2MassBudget',
    no2ContinuityBudget: 'no2MassBudget',
    no2Isotopes: 'no2MassBudget:isotopes',
    no2_isotopes: 'no2MassBudget:isotopes',
    isotopeForensics: 'no2MassBudget:isotopes',
    isotope_forensics: 'no2MassBudget:isotopes',
    delta15N: 'no2MassBudget:isotopes',
    delta15n: 'no2MassBudget:isotopes',
    forenseIsotopico: 'no2MassBudget:isotopes',
    forense_isotopico: 'no2MassBudget:isotopes',
    no2NighttimeChemistry: 'no2NighttimeChemistry',
    no2_nighttime_chemistry: 'no2NighttimeChemistry',
    nighttimeChemistry: 'no2NighttimeChemistry',
    no3RadicalChemistry: 'no2NighttimeChemistry',
    clno2Chemistry: 'no2NighttimeChemistry',
    quimicaNocturnaNo2: 'no2NighttimeChemistry',
    pinnBenchmark: 'benchmark',
    pinnPhysicsInformedLoss: 'benchmark',
    inverseSourceRate: 'inverseSourceRate',
    inverse_source_rate: 'inverseSourceRate',
    inverseSourceEmission: 'inverseSourceRate',
    inverse_source_emission: 'inverseSourceRate',
    qNOxInverse: 'inverseSourceRate',
    tasaEmisionInversa: 'inverseSourceRate',
    tasa_emision_inversa: 'inverseSourceRate',
    portableCloudSync: 'portableCloudSync',
    portable_cloud_sync: 'portableCloudSync',
    cloudSyncUsb: 'portableCloudSync',
    cloud_sync_usb: 'portableCloudSync',

  };
  const mapped = aliasMap[baseId] || aliasMap[baseId.toLowerCase()] || baseId;
  return subtab ? `${mapped}:${subtab}` : mapped;
};

// Conjunto canónico de modales implementados
export const KNOWN_MODAL_IDS = new Set([
  'portableCloudSync', 'portable_cloud_sync', 'cloudSyncUsb', 'cloud_sync_usb',
  'inverseSourceRate', 'inverse_source_rate', 'inverseSourceEmission', 'inverse_source_emission', 'qNOxInverse', 'tasaEmisionInversa', 'tasa_emision_inversa',
  'no2Isotopes', 'no2_isotopes', 'isotopeForensics', 'isotope_forensics', 'delta15N', 'delta15n', 'forenseIsotopico', 'forense_isotopico',
  'no2NighttimeChemistry', 'no2_nighttime_chemistry', 'nighttimeChemistry', 'no3RadicalChemistry', 'clno2Chemistry', 'quimicaNocturnaNo2', 'quimica_nocturna_no2',
  'no2MassBudget', 'no2_mass_budget', 'no2MassBudgetWaterfall', 'no2_mass_budget_waterfall', 'balanceMasaNo2', 'balance_masa_no2', 'no2Waterfall', 'no2_waterfall', 'no2ContinuityBudget',
  'telemetryProvenanceTracker', 'telemetry_provenance_tracker', 'telemetryProvenance', 'provenanceTracker', 'trazabilidadTelemetrica', 'provenanceAudit',
  'systemIntegrityAudit', 'system_integrity_audit', 'auditIntegrity', 'integrityAudit', 'verificacionSistemica', 'verificacion_sistemica',
  'pythonJupyterNotebook', 'python_jupyter_notebook', 'pythonNotebook', 'python_notebook', 'jupyterNotebook', 'jupyter_notebook',
  'tropomiIntercomparison', 'tropomi_intercomparison', 'satellite_tropomi', 'tropomi',
  'acousticAtmosphericCorrelation', 'acoustic_atmospheric_correlation', 'acousticNoise', 'acoustic_noise', 'noiseCoexposure', 'noise_coexposure',
  'umaActinicJNo2', 'uma_actinic_jno2', 'umaActinic', 'uma_actinic', 'umaTeatinos', 'uma_teatinos',
  'ieoCoastalTibl', 'ieo_coastal_tibl', 'ieoTibl', 'ieo_tibl', 'coastalTibl', 'coastal_tibl', 'maretoTibl', 'mareto_tibl',
  'ihsmBiogenicSoa', 'ihsm_biogenic_soa', 'ihsmSoa', 'ihsm_soa', 'laMayoraSoa', 'la_mayora_soa', 'biogenicSoa', 'biogenic_soa',
  'verticalLidarRadar', 'vertical_lidar_radar', 'caliopRadar', 'caliop_radar', 'lidarRadar', 'lidar_radar', 'caliopLidar', 'caliop_lidar',
  'icrp66Dosimetry', 'icrp66_dosimetry', 'icrp66', 'lungDosimetry', 'lung_dosimetry', 'directive2024Audit', 'directive_2024_audit', 'directive2024_2881',
  'fourDVarVsEnkf', 'four_d_var_vs_enkf', 'fourDVar', 'four_d_var', '4dvar', '4dvarEnkf', '4dvar_enkf',
  'w3cProvPassport', 'w3c_prov_passport', 'w3cProv', 'w3c_prov', 'cryptographicProvenance', 'sha256Passport', 'provPassport',
  'huntQCriterion', 'hunt_q_criterion', 'huntQ', 'hunt_q', 'qCriterion', 'q_criterion', 'vortexQ',
  'marineNitrogenDeposition', 'marine_nitrogen_deposition', 'marineDeposition', 'marine_deposition', 'ieoNitrogen', 'ieo_nitrogen', 'bayDeposition',
  'zbeDualSpilloverHalo', 'zbe_dual_spillover_halo', 'zbeSpilloverHalo', 'zbe_spillover_halo', 'zbeHalo', 'zbe_halo', 'zbeSpillover',
  'environmentalJustice', 'environmental_justice', 'justiciaAmbiental', 'justicia_ambiental', 'ineJustice', 'kakwaniAtkinson', 'lorenzAmbiental',
  'vulnerableFacilitiesRisk', 'vulnerable_facilities_risk', 'vulnerableFacilities', 'irsvHeatmap', 'hospitalSchoolRisk',
  'schoolAirEquity', 'school_air_equity', 'schoolStreets', 'school_streets', 'entornosEscolares', 'entornos_escolares', 'pediatricAir', 'pediatricDosimetry',
  'healthEconomicsSas', 'health_economics_sas', 'healthEconomics', 'health_economics', 'costBenefitSas', 'cost_benefit_sas', 'vslMalaga', 'vsl_malaga',
  'greenJustice330300', 'green_justice_330300', 'regla330300', 'regla_3_30_300', 'greenEquity', 'green_equity', 'desiertosVerdes', 'desiertos_verdes',
  'coastalSmlAcidification', 'coastal_sml_acidification', 'smlAcidification', 'sml_acidification', 'acidificacionMarina', 'acidificacion_marina', 'puertoAcidificacion',
  'activePointAudioNarrator', 'active_point_audio_narrator', 'audioNarrator', 'audio_narrator', 'audionarracion', 'audionarracionPuntoActivo', 'pointAudioNarrator',
  'slideTribunal', 'slide_tribunal', 'doctoralSlide', 'doctoral_slide', 'slideDeTribunal',
  'alboranCruiseAirport', 'alboranOceanography', 'alboran_oceanography', 'alboranSea', 'alboran_sea', 'alboran_marine_currents', 'cruisePlumeAirportControl',
  'quickLauncher', 'quick_launcher', 'commandPalette', 'commandHub',
  'acousticAtmosphericCorrelation', 'activePoint7DayHistory', 'active_point_7day_history', 'pointAirQualityHistory', 'point7DayHistory', 'temporal_point_history_7d',
  'correlationScatterPlot', 'correlation_scatter_plot', 'correlationScatter', 'd3ScatterPlot', 'd3_scatter_plot', 'scatterCorrelation',
  'metrologicalCertificate', 'metrological_certificate', 'metrological-certificate', 'pointCertificate', 'point_certificate', 'point-metrological-certificate',
  'microscaleComparator', 'microscale_comparator', 'bipunctualComparator', 'bipunctual_comparator',
  'majorEmissionsSources', 'major_emissions_sources', 'macroEmisoresMalaga', 'macro_emisores_malaga', 'aranaCementPlant', 'arana_cement_plant', 'cementeraArana', 'cementera_arana', 'airportWesternImpact', 'airport_western_impact',
  'acuteEpisodeAlert', 'acute_episode_protocol', 'advancedEnginesSuite', 'advancedTransect',
  'benchmark', 'pinn_benchmark', 'pinnBenchmark', 'pinn_physics_informed_loss',
  'calibrationHistory', 'camsBoundary', 'cams_boundary', 'satellite_cams', 'satelliteAssimilation',
  'canyon', 'canyonGeometryOsm', 'canyonGeometry', 'urban_canopy_lod1', 'canyon_vortex_recirculation',
  'chemicalSpecies', 'aerosol_multimodal_distribution', 'coastalHalogens', 'coastal_halogen_clno2',
  'copert', 'copertTraffic', 'copert_traffic', 'copert_speed_emissions',
  'deckGlInstancing', 'deckgl_gpu_instancing', 'diagnosticCore',
  'earthEngine3DVolumetric', 'earthEngineSatellite', 'ekmaSoa',
  'emtGtfsCopert', 'fairDataExporter', 'fair_data_exporter', 'fair', 'customPdfReport', 'custom_pdf_report', 'customPdf', 'custom_pdf', 'estudioPdf', 'estudio_pdf', 'informe_a_la_carta',
  'fairmode', 'fairmodeValidation', 'fairmode_validation', 'stationValidator',
  'googleMaps3DCanyon', 'juanXXIIICanyon3D', 'juan_xxiii', 'juanxxiii',
  'greenRoofMitigation', 'vegetation',
  'guadalhorceAirport', 'aircraft_lto_kinetics',
  'gumUncertainty', 'gum_uncertainty_budget',
  'healthyRouting', 'highResPdfReport', 'high_res_pdf', 'pdfReport',
  'q1PaperMonograph', 'q1_paper_monograph', 'q1Paper', 'q1_paper', 'paperQ1', 'paper_q1',
  'industrialInventory', 'isorropiaSia',
  'kineticAudit', 'latexThesis', 'latexThesisExporter', 'latex_thesis',
  'leighton', 'extendedLeighton', 'extended_leighton', 'leighton_photostationary', 'unifiedPhotochemistrySuite', 'spectralPhotolysis', 'aod_optical_depth',
  'liveIngestion', 'live_ingestion',
  'malagaTrafficInventory', 'malagaTreesInventory', 'malaga_trees_inventory', 'treeSpeciesConfig',
  'moninObukhov', 'monin_obukhov', 'boundaryLayerProfile', 'boundary_layer_profile', 'monin_obukhov_stability', 'thermalInversion', 'orographic_dem_hillshade',
  'okeRegimes', 'oxidative', 'phdDefenseWalkthrough', 'phd_defense_walkthrough', 'defense',
  'photochemicalRadicals', 'photochemicalRegime', 'populationExposure', 'population_exposure',
  'q1CoastalChemistry', 'q1_coastal_chemistry', 'coastalAtmosphericChemistry', 'coastal_atmospheric_chemistry',
  'seaSaltNitrate', 'sea_salt_nitrate', 'marineNitratePartitioning', 'marine_nitrate_partitioning', 'isorropiaSeaSalt', 'termodinamicaAerosolMarino', 'nitratoAerosolCostero',
  'q1FrontiersSuite', 'd3_advection_diffusion_contour',
  'q1MicroscalePhysics', 'q1_microscale_physics', 'wind_vector_advection',
  'q1ResearchSuite', 'regulatoryAudit', 'saharaDust', 'scientificAtlas',
  'scientificInteroperability', 'seaBreeze', 'coastal_sea_breeze_circulation',
  'secretsManager', 'shipPlumeMicrophysics', 'sobolSensitivity',
  'sourceApportionment', 'stationAudit', 'officialStations', 'official_stations', 'official_monitoring_network',
  'streetMicroscaleInspector', 'streetTreePlanting', 'thesisMethodologySuite', 'tio2Photocatalysis', 'traffic', 'trafficHotspots',
  'trafficLoopsLive', 'treeBvocSoa', 'bvoc_isoprene_monoterpenes', 'bvoc',
  'tropomiIntercomparison', 'tropomi_intercomparison', 'satellite_tropomi',
  'unifiedCanyonSuite', 'urbanCanyonCriticalityScanner', 'urbanCanyonDiagram',
  'urbanHeatIsland', 'urbanHeatIslandThermalBalance', 'urban_heat_island',
  'userGuide', 'guide', 'guia', 'vbsSoa', 'verifier',
  'verticalCanyonSounding', 'verticalSounding', 'vertical_sounding', 'vertical_canyon_sounding',
  'w3cProvGraph', 'w3cProv', 'prov', 'webgpuCompute',
  'weselyDeposition', 'wesely_deposition', 'wesely', 'wesely_dry_deposition', 'weselyDryDeposition',
  'terralMicrophysics', 'terral_microphysics', 'terralGuadalhorce', 'terral_guadalhorce', 'terralWesely', 'terral'
]);

// Componente de reserva metodológica: garantiza que ningún botón jamás falle en silencio
const ScientificModalFallback: React.FC<{
  modalId: string;
  onClose: () => void;
  setActiveModal: (id: string | null) => void;
}> = ({ modalId, onClose, setActiveModal }) => {
  return (
    <DraggableWindow
      title={`Módulo Científico: ${modalId}`}
      subtitle="Enrutamiento y Asimilación Metodológica"
      onClose={onClose}
      headerColorClass="text-emerald-400"
      borderColorClass="border-emerald-600/60"
      className="w-full max-w-xl max-h-[85vh]"
    >
      <div className="p-4 space-y-4 text-slate-200">
        <div className="p-3 bg-emerald-950/30 border border-emerald-800/60 rounded text-xs space-y-1.5">
          <div className="flex items-center gap-2 text-emerald-300 font-bold">
            <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Mapeo Metodológico del Gemelo Digital</span>
          </div>
          <p className="text-slate-300 leading-relaxed text-[11px]">
            El módulo identificado como <code className="text-emerald-300 font-mono bg-black/60 px-1 py-0.5 border border-emerald-800/50 rounded">{modalId}</code> ha sido activado. Para explorar el fenómeno físico, químico o regulatorio correspondiente, seleccione la suite científica consolidada:
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
          <ScientificTooltip
            position="top"
            title="Suite Metodológica de Tesis Doctoral (EIDUNED)"
            normative="UNED Programa de Doctorado • Principios FAIR"
            content="Accede al marco metodológico general, arquitectura computacional y capítulos de la memoria doctoral."
          >
            <button
              onClick={() => setActiveModal('thesisMethodologySuite')}
              className="w-full p-2.5 bg-slate-900/80 hover:bg-emerald-950/50 border border-slate-700 hover:border-emerald-500 rounded text-left transition-all flex items-center justify-between group cursor-pointer"
            >
              <div>
                <div className="font-bold text-slate-200 group-hover:text-emerald-300">Memoria y Metodología UNED</div>
                <div className="text-[10px] text-slate-400">Arquitectura FAIR y EIDUNED</div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-emerald-400" />
            </button>
          </ScientificTooltip>

          <ScientificTooltip
            position="top"
            title="Dinámica de Fluidos en Cañones Urbanos 3D"
            formula="H/W > 0.65 \implies \text{Skimming Flow (Oke 1987)}"
            normative="Oke (1987) • Berkowicz (2000) OSPM"
            content="Inspecciona el régimen vortical, factor de visión de cielo (SVF) y atrapamiento de contaminantes en calles de Málaga."
          >
            <button
              onClick={() => setActiveModal('unifiedCanyonSuite')}
              className="w-full p-2.5 bg-slate-900/80 hover:bg-emerald-950/50 border border-slate-700 hover:border-emerald-500 rounded text-left transition-all flex items-center justify-between group cursor-pointer"
            >
              <div>
                <div className="font-bold text-slate-200 group-hover:text-emerald-300">Cañones Urbanos 3D</div>
                <div className="text-[10px] text-slate-400">Flujo Oke 1988 y Vórtices</div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-emerald-400" />
            </button>
          </ScientificTooltip>

          <ScientificTooltip
            position="top"
            title="Integración Cinética Rígida (Dormand-Prince RK45)"
            formula="\Phi = \frac{J_{\text{NO}_2}[\text{NO}_2]}{k_3[\text{NO}][\text{O}_3]}"
            normative="Leighton (1961) • IUPAC Chemical Kinetics"
            content="Resuelve el ciclo fotoestacionario extendido de Leighton, radicales OH/HO₂/RO₂ y formación de aerosol secundario."
          >
            <button
              onClick={() => setActiveModal('unifiedPhotochemistrySuite')}
              className="w-full p-2.5 bg-slate-900/80 hover:bg-emerald-950/50 border border-slate-700 hover:border-emerald-500 rounded text-left transition-all flex items-center justify-between group cursor-pointer"
            >
              <div>
                <div className="font-bold text-slate-200 group-hover:text-emerald-300">Fotoquímica Rígida RK45</div>
                <div className="text-[10px] text-slate-400">Ciclo Leighton y Aerosoles</div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-emerald-400" />
            </button>
          </ScientificTooltip>

          <ScientificTooltip
            position="top"
            title="Inventario de Emisiones Vehiculares COPERT 5 Tier 3"
            formula="E_i = \sum_k N_k \cdot M_k \cdot EF_{i,k}(v)"
            normative="Guía EMEP/EEA (2023) • Euro 6d / Euro 7"
            content="Modelización determinista de emisiones en caliente, arranque en frío y abrasión de frenos/neumáticos."
          >
            <button
              onClick={() => setActiveModal('copert')}
              className="w-full p-2.5 bg-slate-900/80 hover:bg-emerald-950/50 border border-slate-700 hover:border-emerald-500 rounded text-left transition-all flex items-center justify-between group cursor-pointer"
            >
              <div>
                <div className="font-bold text-slate-200 group-hover:text-emerald-300">Emisiones COPERT 5</div>
                <div className="text-[10px] text-slate-400">Tráfico y Aforos Reales</div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-emerald-400" />
            </button>
          </ScientificTooltip>

          <ScientificTooltip
            position="top"
            title="Auditoría Estadística FAIRMODE WG1 (JRC)"
            formula="\text{MQI} = \frac{\text{RMSE}}{\beta \, U_{95}(O)} \le 1.0"
            normative="Directiva (UE) 2024/2881 • FAIRMODE Guidance"
            content="Diagrama de diana (Target Plot) e indicadores de aptitud regulatoria frente a las estaciones oficiales."
          >
            <button
              onClick={() => setActiveModal('fairmode')}
              className="w-full p-2.5 bg-slate-900/80 hover:bg-emerald-950/50 border border-slate-700 hover:border-emerald-500 rounded text-left transition-all flex items-center justify-between group cursor-pointer"
            >
              <div>
                <div className="font-bold text-slate-200 group-hover:text-emerald-300">Validación FAIRMODE WG1</div>
                <div className="text-[10px] text-slate-400">MQI ≤ 1.0 y Target Plot</div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-emerald-400" />
            </button>
          </ScientificTooltip>

          <ScientificTooltip
            position="top"
            title="Catálogo y Guía Interactiva del Gemelo Digital"
            normative="Documentación Doctoral UNED"
            content="Explora el recorrido guiado paso a paso por todas las consolas analíticas del sistema."
          >
            <button
              onClick={() => setActiveModal('userGuide')}
              className="w-full p-2.5 bg-slate-900/80 hover:bg-emerald-950/50 border border-slate-700 hover:border-emerald-500 rounded text-left transition-all flex items-center justify-between group cursor-pointer"
            >
              <div>
                <div className="font-bold text-slate-200 group-hover:text-emerald-300">Guía de Usuario y Novedades</div>
                <div className="text-[10px] text-slate-400">Catálogo general de módulos</div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-emerald-400" />
            </button>
          </ScientificTooltip>
        </div>
      </div>
    </DraggableWindow>
  );
};

// --- Lazy Imports ---
// Group 1: Chemistry & Photo-physics
const ExtendedLeightonModal = lazy(() => import('./ExtendedLeightonModal').then(m => ({ default: m.ExtendedLeightonModal })));
const PhotochemicalRadicalMechanismModal = lazy(() => import('./PhotochemicalRadicalMechanismModal').then(m => ({ default: m.PhotochemicalRadicalMechanismModal })));
const TreeBvocSoaModal = lazy(() => import('./TreeBvocSoaModal').then(m => ({ default: m.TreeBvocSoaModal })));
const WeselyDryDepositionModal = lazy(() => import('./WeselyDryDepositionModal').then(m => ({ default: m.WeselyDryDepositionModal })));
const Tio2PhotocatalyticModal = lazy(() => import('./Tio2PhotocatalyticModal').then(m => ({ default: m.Tio2PhotocatalyticModal })));
const ChemicalSpeciesHistoricalModal = lazy(() => import('./ChemicalSpeciesHistoricalModal').then(m => ({ default: m.ChemicalSpeciesHistoricalModal })));

// Group 2: Physics & Urban Microscale
const UnifiedUrbanCanyonSuiteModal = lazy(() => import('./UnifiedUrbanCanyonSuiteModal').then(m => ({ default: m.UnifiedUrbanCanyonSuiteModal })));
const Q1OptimizationSuiteModal = lazy(() => import('./Q1OptimizationSuiteModal').then(m => ({ default: m.Q1OptimizationSuiteModal })));
const WebGPUAtmosphericComputeModal = lazy(() => import('./WebGPUAtmosphericComputeModal').then(m => ({ default: m.WebGPUAtmosphericComputeModal })));
const PINNBenchmarkModal = lazy(() => import('./PINNBenchmarkModal').then(m => ({ default: m.PINNBenchmarkModal })));
const StreetCanyonVerticalProfileModal = lazy(() => import('./StreetCanyonVerticalProfileModal').then(m => ({ default: m.StreetCanyonVerticalProfileModal })));
const UrbanCanyonCriticalityScannerModal = lazy(() => import('./UrbanCanyonCriticalityScannerModal').then(m => ({ default: m.UrbanCanyonCriticalityScannerModal })));
const UrbanCanyonMitigationDiagramModal = lazy(() => import('./UrbanCanyonMitigationDiagramModal').then(m => ({ default: m.UrbanCanyonMitigationDiagramModal })));
const GoogleMaps3DCanyonModal = lazy(() => import('./GoogleMaps3DCanyonModal').then(m => ({ default: m.GoogleMaps3DCanyonModal })));
const CanyonGeometryOsmModal = lazy(() => import('./CanyonGeometryOsmModal').then(m => ({ default: m.CanyonGeometryOsmModal })));
const BoundaryLayerVerticalProfileModal = lazy(() => import('./BoundaryLayerVerticalProfileModal').then(m => ({ default: m.BoundaryLayerVerticalProfileModal })));
const SeaBreezeBayModal = lazy(() => import('./SeaBreezeBayModal').then(m => ({ default: m.SeaBreezeBayModal })));
const SaharaDustModal = lazy(() => import('./SaharaDustModal').then(m => ({ default: m.SaharaDustModal })));
const UrbanHeatIslandModal = lazy(() => import('./UrbanHeatIslandModal').then(m => ({ default: m.UrbanHeatIslandModal })));
const GreenRoofVerticalForestModal = lazy(() => import('./GreenRoofVerticalForestModal').then(m => ({ default: m.GreenRoofVerticalForestModal })));
const PythonJupyterNotebookModal = lazy(() => import('./PythonJupyterNotebookModal').then(m => ({ default: m.PythonJupyterNotebookModal })));
const TropomiIntercomparisonModal = lazy(() => import('./TropomiIntercomparisonModal').then(m => ({ default: m.TropomiIntercomparisonModal })));
const AcousticAtmosphericCorrelationModal = lazy(() => import('./AcousticAtmosphericCorrelationModal').then(m => ({ default: m.AcousticAtmosphericCorrelationModal })));
const UmaActinicJNo2Modal = lazy(() => import('./UmaActinicJNo2Modal').then(m => ({ default: m.UmaActinicJNo2Modal })));
const IeoCoastalTiblModal = lazy(() => import('./IeoCoastalTiblModal').then(m => ({ default: m.IeoCoastalTiblModal })));
const IhsmBiogenicSoaModal = lazy(() => import('./IhsmBiogenicSoaModal').then(m => ({ default: m.IhsmBiogenicSoaModal })));
const VerticalLidarRadarModal = lazy(() => import('./VerticalLidarRadarModal').then(m => ({ default: m.VerticalLidarRadarModal })));
const Icrp66DosimetryModal = lazy(() => import('./Icrp66DosimetryModal').then(m => ({ default: m.Icrp66DosimetryModal })));
const FourDVarVsEnkfModal = lazy(() => import('./FourDVarVsEnkfModal').then(m => ({ default: m.FourDVarVsEnkfModal })));
const W3cProvPassportModal = lazy(() => import('./W3cProvPassportModal').then(m => ({ default: m.W3cProvPassportModal })));
const HuntQCriterionModal = lazy(() => import('./HuntQCriterionModal').then(m => ({ default: m.HuntQCriterionModal })));
const MarineNitrogenDepositionModal = lazy(() => import('./MarineNitrogenDepositionModal').then(m => ({ default: m.MarineNitrogenDepositionModal })));
const ZbeDualSpilloverHaloModal = lazy(() => import('./ZbeDualSpilloverHaloModal').then(m => ({ default: m.ZbeDualSpilloverHaloModal })));
const EnvironmentalJusticeModal = lazy(() => import('./EnvironmentalJusticeModal').then(m => ({ default: m.EnvironmentalJusticeModal })));
const SchoolAirEquityModal = lazy(() => import('./SchoolAirEquityModal').then(m => ({ default: m.SchoolAirEquityModal })));
const HealthEconomicsSasModal = lazy(() => import('./HealthEconomicsSasModal').then(m => ({ default: m.HealthEconomicsSasModal })));
const GreenJustice330300Modal = lazy(() => import('./GreenJustice330300Modal').then(m => ({ default: m.GreenJustice330300Modal })));
const CoastalSmlAcidificationModal = lazy(() => import('./CoastalSmlAcidificationModal').then(m => ({ default: m.CoastalSmlAcidificationModal })));
const VulnerableFacilitiesRiskModal = lazy(() => import('./VulnerableFacilitiesRiskModal').then(m => ({ default: m.VulnerableFacilitiesRiskModal })));

// Group 3: Traffic & Emissions
const CopertTrafficModal = lazy(() => import('./CopertTrafficModal').then(m => ({ default: m.CopertTrafficModal })));
const RLineDispersionModal = lazy(() => import('./RLineDispersionModal').then(m => ({ default: m.RLineDispersionModal })));
const TrafficNOxInspectorModal = lazy(() => import('./TrafficNOxInspectorModal').then(m => ({ default: m.TrafficNOxInspectorModal })));
const EmtGtfsCopertModal = lazy(() => import('./EmtGtfsCopertModal').then(m => ({ default: m.EmtGtfsCopertModal })));
const TrafficLoopsLiveModal = lazy(() => import('./TrafficLoopsLiveModal').then(m => ({ default: m.TrafficLoopsLiveModal })));
const ShipPlumeMicrophysicsModal = lazy(() => import('./ShipPlumeMicrophysicsModal').then(m => ({ default: m.ShipPlumeMicrophysicsModal })));
const PortHotellingEmissionsModal = lazy(() => import('./PortHotellingEmissionsModal').then(m => ({ default: m.PortHotellingEmissionsModal })));
const IndustrialInventoryModal = lazy(() => import('./IndustrialInventoryModal').then(m => ({ default: m.IndustrialInventoryModal })));
const MajorEmissionsSourcesModal = lazy(() => import('./MajorEmissionsSourcesModal').then(m => ({ default: m.MajorEmissionsSourcesModal })));
const MalagaTrafficInventoryModal = lazy(() => import('./MalagaTrafficInventoryModal').then(m => ({ default: m.MalagaTrafficInventoryModal })));
const MalagaTreesInventoryModal = lazy(() => import('./MalagaTreesInventoryModal').then(m => ({ default: m.MalagaTreesInventoryModal })));
const StreetTreePlantingInterventionModal = lazy(() => import('./StreetTreePlantingInterventionModal').then(m => ({ default: m.StreetTreePlantingInterventionModal })));

// Group 4: Assimilation & Telemetry
const LiveTelemetryVerifier = lazy(() => import('./LiveTelemetryVerifier').then(m => ({ default: m.LiveTelemetryVerifier })));
const SecretsIntegrationsModal = lazy(() => import('./SecretsIntegrationsModal').then(m => ({ default: m.SecretsIntegrationsModal })));
const SatelliteAssimilationModal = lazy(() => import('./SatelliteAssimilationModal').then(m => ({ default: m.SatelliteAssimilationModal })));
const LiveIngestionPipelineModal = lazy(() => import('./LiveIngestionPipelineModal').then(m => ({ default: m.LiveIngestionPipelineModal })));
const EarthEngineSatelliteModal = lazy(() => import('./EarthEngineSatelliteModal').then(m => ({ default: m.EarthEngineSatelliteModal })));
const EarthEngine3DVolumetricModal = lazy(() => import('./EarthEngine3DVolumetricModal').then(m => ({ default: m.EarthEngine3DVolumetricModal })));

// Group 5: FAIRMODE & Audit
const ProvGraphViewerModal = lazy(() => import('./ProvGraphViewerModal').then(m => ({ default: m.ProvGraphViewerModal })));
const RegulatoryAuditModal = lazy(() => import('./RegulatoryAuditModal').then(m => ({ default: m.RegulatoryAuditModal })));
const SobolSensitivityModal = lazy(() => import('./SobolSensitivityModal').then(m => ({ default: m.SobolSensitivityModal })));
const LatexThesisExporterModal = lazy(() => import('./LatexThesisExporterModal').then(m => ({ default: m.LatexThesisExporterModal })));
const PhDDefenseWalkthroughModal = lazy(() => import('./PhDDefenseWalkthroughModal').then(m => ({ default: m.PhDDefenseWalkthroughModal })));
const HighResPdfReportModal = lazy(() => import('./HighResPdfReportModal').then(m => ({ default: m.HighResPdfReportModal })));
const Q1PaperMonographModal = lazy(() => import('./Q1PaperMonographModal').then(m => ({ default: m.Q1PaperMonographModal })));
const DoctoralPdfReportGuideModal = lazy(() => import('./DoctoralPdfReportGuideModal').then(m => ({ default: m.DoctoralPdfReportGuideModal })));
const ScientificAtlasModal = lazy(() => import('./ScientificAtlasModal').then(m => ({ default: m.ScientificAtlasModal })));
const AcuteEpisodeAlertModal = lazy(() => import('./AcuteEpisodeAlertModal').then(m => ({ default: m.AcuteEpisodeAlertModal })));
const GumUncertaintyInhalationModal = lazy(() => import('./GumUncertaintyInhalationModal').then(m => ({ default: m.GumUncertaintyInhalationModal })));
const CalibrationHistoryModal = lazy(() => import('./CalibrationHistoryModal').then(m => ({ default: m.CalibrationHistoryModal })));
const DeckGLInstancedPollutantsModal = lazy(() => import('./DeckGLInstancedPollutantsModal').then(m => ({ default: m.DeckGLInstancedPollutantsModal })));
const DigitalTwinDiagnosticCore = lazy(() => import('./DigitalTwinDiagnosticCore').then(m => ({ default: m.DigitalTwinDiagnosticCore })));
const PopulationExposureModal = lazy(() => import('./PopulationExposureModal').then(m => ({ default: m.PopulationExposureModal })));
const ScientificDataInteroperabilityModal = lazy(() => import('./ScientificDataInteroperabilityModal').then(m => ({ default: m.ScientificDataInteroperabilityModal })));
const TribunalDefenseAdvisorModal = lazy(() => import('./TribunalDefenseAdvisorModal').then(m => ({ default: m.TribunalDefenseAdvisorModal })));
const StreetMicroscaleInspectorModal = lazy(() => import('./StreetMicroscaleInspectorModal').then(m => ({ default: m.StreetMicroscaleInspectorModal })));
const HealthyRoutingModal = lazy(() => import('./HealthyRoutingModal').then(m => ({ default: m.HealthyRoutingModal })));
const GuadalhorceAirportReceptorModal = lazy(() => import('./GuadalhorceAirportReceptorModal').then(m => ({ default: m.GuadalhorceAirportReceptorModal })));
const SourceApportionmentModal = lazy(() => import('./SourceApportionmentModal').then(m => ({ default: m.SourceApportionmentModal })));
const InverseSourceRateEstimationModal = lazy(() => import('./InverseSourceRateEstimationModal').then(m => ({ default: m.InverseSourceRateEstimationModal })));
const KineticAuditModal = lazy(() => import('./KineticAuditModal').then(m => ({ default: m.KineticAuditModal })));
const AdvancedTransectAnalyzerModal = lazy(() => import('./AdvancedTransectAnalyzerModal').then(m => ({ default: m.AdvancedTransectAnalyzerModal })));
const VerticalCanyonSoundingModal = lazy(() => import('./VerticalCanyonSoundingModal').then(m => ({ default: m.VerticalCanyonSoundingModal })));
const Q1ResearchSuiteModal = lazy(() => import('./Q1ResearchSuiteModal').then(m => ({ default: m.Q1ResearchSuiteModal })));
const Q1FrontiersSuiteModal = lazy(() => import('./Q1FrontiersSuiteModal').then(m => ({ default: m.Q1FrontiersSuiteModal })));
const Q1CoastalAtmosphericChemistryModal = lazy(() => import('./Q1CoastalAtmosphericChemistryModal').then(m => ({ default: m.Q1CoastalAtmosphericChemistryModal })));
const Q1MicroscaleAtmosphericPhysicsModal = lazy(() => import('./Q1MicroscaleAtmosphericPhysicsModal').then(m => ({ default: m.Q1MicroscaleAtmosphericPhysicsModal })));
const AdvancedEnginesSuiteModal = lazy(() => import('./AdvancedEnginesSuiteModal').then(m => ({ default: m.AdvancedEnginesSuiteModal })));
const UserGuideTourModal = lazy(() => import('./UserGuideTourModal').then(m => ({ default: m.UserGuideTourModal })));
const ActivePoint7DayHistoryModal = lazy(() => import('./ActivePoint7DayHistoryModal').then(m => ({ default: m.ActivePoint7DayHistoryModal })));
const ActivePointCorrelationScatterModal = lazy(() => import('./ActivePointCorrelationScatterModal').then(m => ({ default: m.ActivePointCorrelationScatterModal })));
const PointMetrologicalCertificateModal = lazy(() => import('./PointMetrologicalCertificateModal').then(m => ({ default: m.PointMetrologicalCertificateModal })));
const BipunctualMicroscaleComparatorModal = lazy(() => import('./BipunctualMicroscaleComparatorModal').then(m => ({ default: m.BipunctualMicroscaleComparatorModal })));
const AlboranSeaCruiseAirportControlModal = lazy(() => import('./AlboranSeaCruiseAirportControlModal').then(m => ({ default: m.AlboranSeaCruiseAirportControlModal })));
const ActivePointAudioNarratorModal = lazy(() => import('./ActivePointAudioNarratorModal').then(m => ({ default: m.ActivePointAudioNarratorModal })));
const SystemIntegrityAuditModal = lazy(() => import('./SystemIntegrityAuditModal').then(m => ({ default: m.SystemIntegrityAuditModal })));
const TelemetryProvenanceTracker = lazy(() => import('./TelemetryProvenanceTracker').then(m => ({ default: m.TelemetryProvenanceTracker })));
const NO2MassBudgetWaterfallModal = lazy(() => import('./NO2MassBudgetWaterfallModal').then(m => ({ default: m.NO2MassBudgetWaterfallModal })));
const NO2NighttimeChemistryModal = lazy(() => import('./NO2NighttimeChemistryModal').then(m => ({ default: m.NO2NighttimeChemistryModal })));
const PortableCloudSyncModal = lazy(() => import('./PortableCloudSyncModal').then(m => ({ default: m.PortableCloudSyncModal })));

export interface ScientificModalRegistryProps {
  activeModal: string | null;
  setActiveModal: (modal: string | null) => void;
  data: any;
  result: any;
  benchmarkParams: any;
  odeParams: any;
  trafficNoxData: any;
  getDiurnalTrafficFactor: () => { factor: number; periodLabel: string };
  flyToLocation: (lat: number, lon: number, zoom?: number, pitch?: number) => void;
  applyCameraPreset?: (preset: 'free' | 'canyon' | 'downwind' | 'bay' | 'zenith' | 'birdeye') => void;
  location: { lat: number; lon: number };
  selectedTreeStreetId: string;
  treeModalInitialTab: any;
  telemetryAudit: any;
  handleRetestTelemetry: () => void;
  isRetesting: boolean;
  setData: React.Dispatch<React.SetStateAction<any>>;
  stationComparisons: any;
  mapRef: any;
  mapContainerRef: any;
  is3DMode: boolean;
  activeBaseStyle: string;
  showBuildings: boolean;
  showWindParticles: boolean;
  showDeckGLMesh: boolean;
  calibrationLogs: any[];
  rawUrbanPoints: any[];
  historyData: any[];
  marineFlowGeoJson: any;
  // DeckGL states
  deckGlActiveSpecies: any;
  setDeckGlActiveSpecies: any;
  deckGlEnabledSpecies: any;
  setDeckGlEnabledSpecies: any;
  deckGlMultiLayerMode: any;
  setDeckGlMultiLayerMode: any;
  deckGlElevationScale: any;
  setDeckGlElevationScale: any;
  deckGlColumnRadius: any;
  setDeckGlColumnRadius: any;
  deckGlDiskResolution: any;
  setDeckGlDiskResolution: any;
  deckGlWireframe: any;
  setDeckGlWireframe: any;
  deckGlOpacity: any;
  setDeckGlOpacity: any;
  instancedBuffers: any;
  calculatePINNParameters: (data: any) => any;
}

const ScientificModalRegistryBase: React.FC<ScientificModalRegistryProps> = ({
  activeModal, setActiveModal, data, result, benchmarkParams, odeParams,
  trafficNoxData, getDiurnalTrafficFactor, flyToLocation, applyCameraPreset, location,
  selectedTreeStreetId, treeModalInitialTab, telemetryAudit, handleRetestTelemetry,
  isRetesting, setData, stationComparisons, mapRef, mapContainerRef,
  is3DMode, activeBaseStyle, showBuildings, showWindParticles, showDeckGLMesh,
  calibrationLogs, rawUrbanPoints, historyData, marineFlowGeoJson,
  deckGlActiveSpecies, setDeckGlActiveSpecies, deckGlEnabledSpecies,
  setDeckGlEnabledSpecies, deckGlMultiLayerMode, setDeckGlMultiLayerMode,
  deckGlElevationScale, setDeckGlElevationScale, deckGlColumnRadius,
  setDeckGlColumnRadius, deckGlDiskResolution, setDeckGlDiskResolution,
  deckGlWireframe, setDeckGlWireframe, deckGlOpacity, setDeckGlOpacity,
  instancedBuffers, calculatePINNParameters
}) => {
  const targetModal = useMemo(() => normalizeModalId(activeModal), [activeModal]);
  const activeCtx = useActivePoint();

  // Concentraciones y morfología sincronizadas en tiempo real con el Punto Activo (Regla 10 y Regla 18 AGENTS.md)
  const activeNO2 = activeCtx?.assimilation?.no2PedestrianLevel1_8mUgM3 ?? data.no2_satelite_base ?? 28.0;
  const activeO3 = activeCtx?.assimilation?.ozoneO3UgM3 ?? data.ozone ?? 42.0;
  const activePM25 = activeCtx?.assimilation?.pm25UgM3 ?? data.pm2_5 ?? 9.8;
  const activePM10 = activeCtx?.assimilation?.pm10UgM3 ?? data.pm10 ?? 18.5;
  const activeNO = data.no ?? Number((activeNO2 * 0.35).toFixed(1));
  const activeHW = activeCtx?.assimilation?.aspectRatioHw ?? activeCtx?.activePoint?.aspectRatioHw ?? data.aspect_ratio_hw ?? 1.38;
  const activeLat = activeCtx?.activePoint?.lat ?? location.lat;
  const activeLon = activeCtx?.activePoint?.lon ?? location.lon;

  // Centralized memoized physics computation callback: prevents re-evaluating when camera bearing or pitch updates
  const computePINNPhysics = useCallback((meteoData: any) => {
    if (result) return result;
    if (!meteoData) return null;
    return calculatePINNParameters(meteoData);
  }, [result, calculatePINNParameters]);

  // Centralized physics result memoized against meteoData changes
  const memoizedPhysics = useMemo(() => {
    return computePINNPhysics(data);
  }, [computePINNPhysics, data]);

  // Centralized memoized modal matching function
  const isMatch = useCallback((...ids: string[]) => {
    if (!activeModal) return false;
    const activeBase = activeModal.includes(':') ? activeModal.split(':')[0] : activeModal;
    const targetBase = targetModal.includes(':') ? targetModal.split(':')[0] : targetModal;
    const activeSubtab = activeModal.includes(':') ? activeModal.split(':')[1] : '';
    const activeLower = activeModal.toLowerCase();
    const activeBaseLower = activeBase.toLowerCase();

    return ids.some(id => {
      const normCand = normalizeModalId(id);
      const candBase = id.includes(':') ? id.split(':')[0] : id;
      return (
        activeModal === id ||
        targetModal === id ||
        targetModal === normCand ||
        activeBase === id ||
        targetBase === id ||
        activeBase === candBase ||
        targetBase === candBase ||
        activeSubtab === id ||
        activeLower === id.toLowerCase() ||
        activeBaseLower === id.toLowerCase()
      );
    });
  }, [activeModal, targetModal]);

  // Centralized memoized topic extractor
  const extractAtlasTopic = useCallback((id: string | null): any => {
    if (!id) return 'leighton_photostationary';
    if (id.startsWith('scientificAtlas:')) return id.replace('scientificAtlas:', '');
    if (id.startsWith('atlas:')) return id.replace('atlas:', '');
    if (id.includes(':') && (id.startsWith('scientificAtlas') || id.startsWith('atlas'))) return id.split(':')[1];
    return 'leighton_photostationary';
  }, []);

  // Centralized memoized subtab extractor for deep linking
  const extractSubtab = useCallback((id: string | null): string | undefined => {
    if (!id || !id.includes(':')) return undefined;
    return id.split(':')[1];
  }, []);

  // Centralized memoized station pairs for interoperability table
  const memoizedOfficialPairs = useMemo(() => {
    if (!stationComparisons || !Array.isArray(stationComparisons)) return undefined;
    return stationComparisons.map((s: any) => ({
      station: s.name,
      obs: s.observed,
      sim: s.simulated
    }));
  }, [stationComparisons]);

  if (!activeModal) return null;

  return (
    <SectionErrorBoundary
      fallbackTitle={`Módulo Científico (${activeModal || 'General'})`}
      onReset={() => setActiveModal(null)}
    >
      <Suspense fallback={null}>
        <AnimatePresence>
        {/* CHEMISTRY & PHOTO-PHYSICS CONSOLIDATED MASTER SUITE */}
        {(isMatch('unifiedPhotochemistrySuite', 'leighton', 'spectralPhotolysis', 'extendedLeighton', 'leighton_photostationary', 'oxidative', 'coastalHalogens', 'photochemicalRegime', 'ekmaSoa', 'vbsSoa', 'isorropiaSia') || activeModal === 'extendedLeighton:tio2_photocatalysis') && (
          <ExtendedLeightonModal
            key="unified-photochemistry-suite"
            initialTab={
              (extractSubtab(activeModal) as any) ||
              (isMatch('oxidative') ? 'radicals_oxidation' :
              isMatch('coastalHalogens') ? 'coastal_halogens' :
              isMatch('photochemicalRegime', 'ekmaSoa') ? 'ekma_regimes' :
              isMatch('vbsSoa', 'isorropiaSia') ? 'secondary_aerosols' : 'leighton_photolysis')
            }
            onClose={() => setActiveModal(null)}
          />
        )}
        
        {isMatch('photochemicalRadicals') && (
          <PhotochemicalRadicalMechanismModal
            key="radicals"
            isOpen={true}
            onClose={() => setActiveModal(null)}
            temperatureC={data.temperatura_malaga || 23.5}
            uvIndex={data.uv_index || 6.5}
            noPpb={activeNO}
            no2Ppb={activeNO2}
            o3Ppb={activeO3}
            coPpb={320.0}
            so2Ppb={data.so2 || 2.4}
          />
        )}

        {/* PHYSICS & CANYONS */}
        {isMatch('webgpuCompute') && (
          <WebGPUAtmosphericComputeModal
            key="webgpu"
            isOpen={true}
            onClose={() => setActiveModal(null)}
            windSpeedKmh={data.velocidad_viento_km_h || 12}
            windDirDeg={data.direccion_viento_grados || 220}
            temperatureC={data.temperatura_malaga || 22}
            solarUV={data.uv_index || 5}
            ambientNO2={activeNO2}
          />
        )}

        {isMatch('benchmark', 'pinn_physics_informed_loss', 'pinn_benchmark', 'pinnBenchmark') && (
          <PINNBenchmarkModal
            key="benchmark"
            benchmarkParams={benchmarkParams}
            odeParams={odeParams}
            defaultTab={
              (extractSubtab(activeModal) as any) ||
              (extractSubtab(targetModal) as any) ||
              'benchmark'
            }
            onClose={() => setActiveModal(null)}
          />
        )}
        
        {isMatch('unifiedCanyonSuite', 'okeRegimes', 'canyonGeometryOsm', 'urbanCanyonCriticalityScanner', 'canyonGeometry', 'urban_canopy_lod1', 'solarShadingCanyon', 'solar_shading', 'canyonMitigation', 'streetViewCanyon', 'googleStreetViewTab') && (
          <UnifiedUrbanCanyonSuiteModal
            key="unified-canyon-suite"
            onClose={() => setActiveModal(null)}
            defaultTab={
              (extractSubtab(activeModal) as any) ||
              (isMatch('canyonGeometryOsm', 'canyonGeometry', 'urban_canopy_lod1') ? 'catalog' :
              isMatch('solarShadingCanyon', 'solar_shading') ? 'solar_shading' :
              isMatch('canyonMitigation') ? 'mitigation' :
              isMatch('streetViewCanyon', 'googleStreetViewTab') ? 'street_view' : 'regimes')
            }
            data={data}
            location={{ lat: activeLat, lon: activeLon }}
            flyToLocation={flyToLocation}
            applyCameraPreset={applyCameraPreset}
          />
        )}

        {isMatch('canyon') && (
          <StreetCanyonVerticalProfileModal
            key="canyon"
            isOpen={true}
            onClose={() => setActiveModal(null)}
            currentWindSpeedKmh={data.velocidad_viento_km_h}
            currentWindDirDeg={data.direccion_viento_grados}
            currentNO2Base={activeNO2}
            currentTemp={data.temperatura_malaga}
            currentSolarUV={data.uv_index}
            aspectRatioHW={activeHW}
          />
        )}

        {isMatch('q1Optimization') && (
          <Q1OptimizationSuiteModal key="q1opt" isOpen={true} onClose={() => setActiveModal(null)} />
        )}

        {isMatch('juanXXIIICanyon3D', 'googleMaps3DCanyon', 'juan_xxiii', 'juanxxiii') && (
          <GoogleMaps3DCanyonModal
            key="maps3d"
            isOpen={true}
            onClose={() => setActiveModal(null)}
            currentWindSpeedKmh={data.velocidad_viento_km_h || 14}
            currentWindDirDeg={data.direccion_viento_grados || 240}
            currentNO2Base={activeNO2}
            currentTemp={data.temperatura_malaga || 25.5}
            currentSolarUV={data.uv_index || 6}
          />
        )}

        {/* TRAFFIC, MOBILITY & MULTIMODAL EMISSIONS CONSOLIDATED MASTER SUITE */}
        {isMatch('copert', 'copertTraffic', 'copert_traffic', 'copert_speed_emissions', 'malagaTrafficInventory') && (
          <CopertTrafficModal
            key="unified-traffic-suite"
            initialTab={
              (extractSubtab(activeModal) as any) ||
              (isMatch('copert_speed_emissions') ? 'speed_curves' :
              isMatch('malagaTrafficInventory') ? 'malaga_inventory' : 'overview')
            }
            onClose={() => setActiveModal(null)}
          />
        )}

        {isMatch('rline', 'rlineDispersion', 'r_line', 'rline_dispersion') && (
          <RLineDispersionModal key="rline" isOpen={true} onClose={() => setActiveModal(null)} />
        )}
        
        {isMatch('traffic', 'trafficHotspots') && (
          <TrafficNOxInspectorModal
            key="traffic"
            isOpen={true}
            onClose={() => setActiveModal(null)}
            temporalFactor={getDiurnalTrafficFactor().factor}
            periodLabel={getDiurnalTrafficFactor().periodLabel}
            totalNetworkNOx_g_s={trafficNoxData?.totalNetworkNOx_g_s || 1.85}
            criticalSegmentsCount={trafficNoxData?.criticalSegmentsCount || 6}
            averageFlowVehH={trafficNoxData?.averageFlowVehH || 1450}
            onSelectHotspot={(lat, lon) => flyToLocation(lat, lon, 16.8, 45)}
          />
        )}

        {/* ASSIMILATION & TELEMETRY */}
        {isMatch('verifier') && (
          <LiveTelemetryVerifier 
            key="verifier"
            audit={telemetryAudit} 
            onClose={() => setActiveModal(null)} 
            onRetest={handleRetestTelemetry}
            isRetesting={isRetesting}
          />
        )}

        {isMatch('secretsManager') && (
          <SecretsIntegrationsModal
            key="secrets"
            isOpen={true}
            onClose={() => setActiveModal(null)}
            onApplyLiveMeteo={(patch) => setData((prev: any) => ({ ...prev, ...patch }))}
          />
        )}

        {/* FAIRMODE & VALIDATION */}
        {isMatch('fairmode', 'fairmodeValidation', 'stationValidator') && (
          <FairmodeStatisticalMetricsModal
            key="fairmode"
            isOpen={true}
            onClose={() => setActiveModal(null)}
            stations={stationComparisons}
            initialTab={isMatch('stationValidator') ? 'station_1to1' : 'fairmode_kpi'}
          />
        )}

        {isMatch('deckGlInstancing', 'deckgl_gpu_instancing') && (
          <DeckGLInstancedPollutantsModal
            key="deckgl"
            onClose={() => setActiveModal(null)}
            activeSpecies={deckGlActiveSpecies}
            onSelectSpecies={setDeckGlActiveSpecies}
            enabledSpecies={deckGlEnabledSpecies}
            onToggleSpecies={(sp) => {
              setDeckGlEnabledSpecies((prev: Set<any>) => {
                const next = new Set(prev);
                if (next.has(sp)) {
                  if (next.size > 1) next.delete(sp);
                } else {
                  next.add(sp);
                }
                return next;
              });
            }}
            multiLayerMode={deckGlMultiLayerMode}
            onToggleMultiLayerMode={setDeckGlMultiLayerMode}
            elevationScale={deckGlElevationScale}
            onElevationScaleChange={setDeckGlElevationScale}
            columnRadius={deckGlColumnRadius}
            onColumnRadiusChange={setDeckGlColumnRadius}
            diskResolution={deckGlDiskResolution}
            onDiskResolutionChange={setDeckGlDiskResolution}
            wireframe={deckGlWireframe}
            onToggleWireframe={setDeckGlWireframe}
            opacity={deckGlOpacity}
            onOpacityChange={setDeckGlOpacity}
            buffersSummary={instancedBuffers ? {
              instanceCount: instancedBuffers.instanceCount,
              vramInstancedBytes: instancedBuffers.vramInstancedBytes,
              vramTraditionalMeshBytes: instancedBuffers.vramTraditionalMeshBytes,
              memoryReductionPct: instancedBuffers.memoryReductionPct
            } : undefined}
          />
        )}

        {isMatch('diagnosticCore') && (
          <DigitalTwinDiagnosticCore
            key="diagnostic"
            isOpen={true}
            onClose={() => setActiveModal(null)}
            baseNo2Ppb={activeNO2 * 0.53}
            baseO3Ppb={activeO3 * 0.51}
          />
        )}

        {/* SUITES Y MÓDULOS CIENTÍFICOS */}
        {isMatch('urbanCanyonDiagram', 'canyon_vortex_recirculation') && (
          <UrbanCanyonMitigationDiagramModal key="canyon-diag" onClose={() => setActiveModal(null)} ambientTemp={data.temperatura_malaga} ambientNO2={activeNO2} ambientWind={data.velocidad_viento_km_h / 3.6} />
        )}
        {isMatch('emtGtfsCopert') && <EmtGtfsCopertModal key="emt" onClose={() => setActiveModal(null)} />}
        {isMatch('trafficLoopsLive') && <TrafficLoopsLiveModal key="loops" onClose={() => setActiveModal(null)} onFlyTo={(lat, lon) => flyToLocation(lat, lon, 16.5, 55)} />}
        
        {isMatch('moninObukhov', 'thermalInversion', 'boundaryLayerProfile', 'monin_obukhov_stability', 'orographic_dem_hillshade') && (
          <BoundaryLayerVerticalProfileModal
            key={isMatch('thermalInversion', 'orographic_dem_hillshade') ? 'thermal-inv' : 'monin'}
            initialTab={isMatch('thermalInversion', 'orographic_dem_hillshade') ? 'sounding' : 'most_turbulence'}
            onClose={() => setActiveModal(null)}
            baseTempC={data.temperatura_malaga}
            windSpeedSurface={data.velocidad_viento_km_h / 3.6}
            windDirDeg={data.direccion_viento_grados}
            solarRadiationWm2={data.shortwave_radiation}
            relativeHumidity={data.humedad_relativa}
            surfaceNOxUgm3={activeNO2}
          />
        )}
        
        {isMatch('seaBreeze', 'coastal_sea_breeze_circulation') && (
          <SeaBreezeBayModal key="breeze" isOpen={true} onClose={() => setActiveModal(null)} tempLandC={data.temperatura_malaga} windSpeedKmh={data.velocidad_viento_km_h} windDirDeg={data.direccion_viento_grados} solarRadWm2={data.shortwave_radiation} />
        )}
        {isMatch('portEmissions', 'portHotellingEmissions', 'portCruises') && (
          <PortHotellingEmissionsModal key="port" onClose={() => setActiveModal(null)} initialTab="briggs" onFlyTo={(lat, lon) => flyToLocation(lat, lon, 16.5, 50)} />
        )}
        {isMatch('shipPlumeMicrophysics') && (
          <ShipPlumeMicrophysicsModal key="ship" onClose={() => setActiveModal(null)} ambientTempC={data.temperatura_malaga} relativeHumidity={data.humedad_relativa} windSpeedMS={data.velocidad_viento_km_h / 3.6} />
        )}
        {isMatch('industrialInventory') && <IndustrialInventoryModal key="ind" onClose={() => setActiveModal(null)} />}
        {isMatch('guadalhorceAirport', 'aircraft_lto_kinetics') && (
          <GuadalhorceAirportReceptorModal key="airport" isOpen={true} onClose={() => setActiveModal(null)} ambientTempC={data.temperatura_malaga} windSpeedMs={data.velocidad_viento_km_h / 3.6} windDirDeg={data.direccion_viento_grados} />
        )}
        {isMatch('majorEmissionsSources', 'macroEmisoresMalaga', 'aranaCementPlant', 'cementeraArana', 'airportWesternImpact') && (
          <MajorEmissionsSourcesModal key="macro-sources" onClose={() => setActiveModal(null)} flyToLocation={flyToLocation} />
        )}
        {isMatch('saharaDust') && (
          <SaharaDustModal key="dust" isOpen={true} onClose={() => setActiveModal(null)} dustConcentrationUgm3={data.dust || 35} aod550nm={result?.aod || 0.35} tempC={data.temperatura_malaga} relHumidityPct={data.humedad_relativa} windSpeedKmh={data.velocidad_viento_km_h} />
        )}
        {isMatch('sourceApportionment') && (
          <SourceApportionmentModal key="source" onClose={() => setActiveModal(null)} ambientTempC={data.temperatura_malaga} windSpeedKmH={data.velocidad_viento_km_h} windDirDeg={data.direccion_viento_grados} camsSaharaDustUgm3={Math.round(activePM10 * 0.45)} />
        )}
        {/* GREEN INFRASTRUCTURE, NBS & BIOGENICS CONSOLIDATED MASTER SUITE */}
        {isMatch('malagaTreesInventory', 'treeSpeciesConfig', 'urbanHeatIsland', 'urbanHeatIslandThermalBalance', 'treeBvocSoa', 'bvoc_isoprene_monoterpenes', 'bvoc') && (
          <MalagaTreesInventoryModal
            key="trees-inv"
            initialStreetId={selectedTreeStreetId}
            initialTab={
              (extractSubtab(activeModal) as any) ||
              (isMatch('species_config', 'treeSpeciesConfig') ? 'species_config' :
              isMatch('uhi_energy_balance', 'urbanHeatIsland', 'urbanHeatIslandThermalBalance') ? 'uhi_energy_balance' :
              isMatch('bvoc_emissions', 'treeBvocSoa', 'bvoc_isoprene_monoterpenes', 'bvoc') ? 'bvoc_emissions' : treeModalInitialTab)
            }
            onClose={() => setActiveModal(null)}
          />
        )}
        {isMatch('streetTreePlanting') && <StreetTreePlantingInterventionModal key="tree-planting" onClose={() => setActiveModal(null)} initialStreetId={selectedTreeStreetId} />}
        {isMatch('greenRoofMitigation', 'vegetation') && (
          <GreenRoofVerticalForestModal key="greenroof" onClose={() => setActiveModal(null)} currentLat={activeLat} currentLon={activeLon} currentTemp={data.temperatura_malaga} currentRH={data.humedad_relativa} currentWindSpeed={data.velocidad_viento_km_h / 3.6} currentNO2Base={activeNO2} />
        )}
        {isMatch('tio2Photocatalysis') && <Tio2PhotocatalyticModal key="tio2" onClose={() => setActiveModal(null)} />}
        {isMatch('healthyRouting') && <HealthyRoutingModal key="routing" isOpen={true} onClose={() => setActiveModal(null)} />}
        {isMatch('chemicalSpecies', 'aerosol_multimodal_distribution') && (
          <ChemicalSpeciesHistoricalModal key="species" isOpen={true} onClose={() => setActiveModal(null)} currentTempC={data.temperatura_malaga} currentRH={data.humedad_relativa} currentUV={data.uv_index} currentNO2Base={activeNO2} />
        )}
        
        {/* ESTACIONES OFICIALES Y TELEMETRÍA */}
        {isMatch('stationAudit', 'officialStations', 'official_monitoring_network', 'audit', 'observatorio') && (
          <OfficialStationsModal key="audit" isOpen={true} onClose={() => setActiveModal(null)} stations={stationComparisons} onFlyToStation={(lat, lon) => flyToLocation(lat, lon, 16.8, 0)} onApplyStationData={(patch) => setData((prev: any) => ({ ...prev, ...patch }))} />
        )}

        {isMatch('satelliteAssimilation', 'camsBoundary', 'satellite_cams') && (
          <SatelliteAssimilationModal
            key="sat"
            isOpen={true}
            onClose={() => setActiveModal(null)}
            no2BaseUgm3={activeNO2}
            o3BaseUgm3={activeO3}
            tempCBase={data.temperatura_malaga}
            aodBase={result?.aod || 0.35}
          />
        )}
        {isMatch('liveIngestion') && <LiveIngestionPipelineModal key="ingestion" isOpen={true} onClose={() => setActiveModal(null)} />}
        {isMatch('earthEngineSatellite') && <EarthEngineSatelliteModal key="ee" isOpen={true} onClose={() => setActiveModal(null)} onFlyToReceptor={(lat, lon) => flyToLocation(lat, lon, 16.5, 30)} />}
        {isMatch('earthEngine3DVolumetric') && <EarthEngine3DVolumetricModal key="ee-3d" isOpen={true} onClose={() => setActiveModal(null)} />}
        {isMatch('vulnerableFacilitiesRisk', 'vulnerableFacilities', 'irsvHeatmap', 'hospitalSchoolRisk') && (
          <VulnerableFacilitiesRiskModal
            key="vulnerable-facilities"
            isOpen={true}
            onClose={() => setActiveModal(null)}
            onFlyToLocation={(lat, lon, zoom, pitch) => flyToLocation(lat, lon, zoom, pitch)}
          />
        )}
        {/* PUBLIC HEALTH, DOSIMETRY & EQUITY CONSOLIDATED MASTER SUITE */}
        {isMatch('populationExposure', 'population_exposure') && (
          <PopulationExposureModal
            key="exposure"
            isOpen={true}
            onClose={() => setActiveModal(null)}
            data={data}
            result={result}
            onFlyTo={flyToLocation}
            initialTab={(extractSubtab(activeModal) as any) || 'districts'}
          />
        )}
        {isMatch('thesisMethodologySuite') && (
          <ThesisMethodologySuiteModal
            key="methodology"
            isOpen={true}
            onClose={() => setActiveModal(null)}
            onOpenModal={(m) => setActiveModal(m)}
            initialTab={(extractSubtab(activeModal) as any) || 'director_roadmap'}
          />
        )}
        {isMatch('scientificInteroperability') && <ScientificDataInteroperabilityModal key="interop" isOpen={true} onClose={() => setActiveModal(null)} officialPairs={memoizedOfficialPairs} />}
        {isMatch('w3cProvGraph', 'w3cProv') && <ProvGraphViewerModal key="prov" isOpen={true} onClose={() => setActiveModal(null)} />}
        {isMatch('regulatoryAudit') && <RegulatoryAuditModal key="reg-audit" data={data} onClose={() => setActiveModal(null)} />}
        {isMatch('sobolSensitivity', 'sobol') && <SobolSensitivityModal key="sobol" onClose={() => setActiveModal(null)} />}
        {isMatch('latexThesis', 'latexThesisExporter') && <LatexThesisExporterModal key="latex" isOpen={true} onClose={() => setActiveModal(null)} meteo={data} physics={memoizedPhysics} stationComparisons={stationComparisons} />}
        {isMatch('phdDefenseWalkthrough', 'defense') && (
          <PhDDefenseWalkthroughModal 
            key="walkthrough" 
            isOpen={true} 
            onClose={() => setActiveModal(null)} 
            meteo={data} 
            physics={memoizedPhysics} 
            stationComparisons={stationComparisons} 
            onOpenLatexModal={() => setActiveModal('latexThesis')} 
            onOpenPdfReportModal={() => setActiveModal('highResPdfReport')}
          />
        )}
        {isMatch('tribunalDefenseAdvisor', 'tribunal_defense', 'eiduned_defense') && (
          <TribunalDefenseAdvisorModal key="tribunal" isOpen={true} onClose={() => setActiveModal(null)} />
        )}
        {isMatch('streetMicroscaleInspector') && <StreetMicroscaleInspectorModal key="micro-insp" isOpen={true} onClose={() => setActiveModal(null)} meteo={data} physics={memoizedPhysics} stationComparisons={stationComparisons} onFlyToLocation={(lat, lon) => flyToLocation(lat, lon, 16.5, 45)} />}
        {isMatch('highResPdfReport', 'pdfReport') && <HighResPdfReportModal key="pdf" meteo={data} physics={memoizedPhysics} stationComparisons={stationComparisons} benchmarkParams={benchmarkParams} odeParams={odeParams} location={location} mapRef={mapRef} mapContainerRef={mapContainerRef} is3DMode={is3DMode} activeBaseStyle={activeBaseStyle} showBuildings={showBuildings} showWindParticles={showWindParticles} showDeckGLMesh={showDeckGLMesh} onClose={() => setActiveModal(null)} />}
        {isMatch('q1PaperMonograph', 'q1Paper', 'paperQ1') && (
          <Q1PaperMonographModal key="q1-paper" onClose={() => setActiveModal(null)} />
        )}
        {isMatch('doctoralReportGuide', 'pdfReportGuide', '12pagesGuide') && (
          <DoctoralPdfReportGuideModal 
            key="pdf-guide" 
            onClose={() => setActiveModal(null)} 
            onOpenPdfGenerator={() => setActiveModal('highResPdfReport')} 
          />
        )}
        {isMatch('fairDataExporter', 'fair', 'customPdfReport', 'custom_pdf', 'customPdf', 'estudioPdf') && (
          <FairDataExporterModal 
            key="fair-export" 
            isOpen={true} 
            onClose={() => setActiveModal(null)} 
            onOpenModal={(m) => setActiveModal(m)}
            rawUrbanPoints={rawUrbanPoints} 
            historyData={historyData} 
            currentMeteo={data} 
            marineFlowGeoJson={marineFlowGeoJson}
            physics={memoizedPhysics}
            stationComparisons={stationComparisons}
            benchmarkParams={benchmarkParams}
            odeParams={odeParams}
            location={location}
            initialSubTab={
              (extractSubtab(activeModal) as any) ||
              (isMatch('customPdfReport', 'custom_pdf', 'customPdf', 'estudioPdf') ? 'custom_pdf' : 'all_pdfs')
            }
          />
        )}
        
        {/* ATLAS FÍSICO (21 TÓPICOS) */}
        {(isMatch('scientificAtlas') || (activeModal && (activeModal.startsWith('scientificAtlas:') || activeModal.startsWith('atlas:')))) && (
          <ScientificAtlasModal key="atlas" isOpen={true} initialTopicId={extractAtlasTopic(activeModal)} onClose={() => setActiveModal(null)} onOpenModal={(m) => setActiveModal(m)} />
        )}
        
        {isMatch('acuteEpisodeAlert', 'acute_episode_protocol') && (
          <AcuteEpisodeAlertModal key="alert" isOpen={true} onClose={() => setActiveModal(null)} ambientTempC={data.temperatura_malaga} windSpeedKmH={data.velocidad_viento_km_h} windDirDeg={data.direccion_viento_grados} relativeHumidity={data.humedad_relativa} solarRadiationWm2={data.shortwave_radiation} no2Ugm3={activeNO2} o3Ugm3={activeO3} pm10Ugm3={activePM10} pm25Ugm3={activePM25} />
        )}
        {isMatch('gumUncertainty', 'gum_uncertainty_budget') && (
          <GumUncertaintyInhalationModal key="gum" isOpen={true} onClose={() => setActiveModal(null)} no2Ugm3={activeNO2} o3Ugm3={activeO3} pm10Ugm3={activePM10} windSpeedMs={data.velocidad_viento_km_h / 3.6} solarRadiationWm2={data.shortwave_radiation} />
        )}
        {isMatch('calibrationHistory') && <CalibrationHistoryModal key="calib" logs={calibrationLogs} onClose={() => setActiveModal(null)} />}
        {isMatch('kineticAudit') && <KineticAuditModal key="kin-audit" onClose={() => setActiveModal(null)} />}
        {isMatch('advancedTransect') && <AdvancedTransectAnalyzerModal key="transect" isOpen={true} onClose={() => setActiveModal(null)} />}
        
        {/* SONDEO VERTICAL EN CAÑÓN */}
        {isMatch('verticalCanyonSounding', 'verticalSounding') && <VerticalCanyonSoundingModal key="sounding" isOpen={true} onClose={() => setActiveModal(null)} />}
        
        {/* FRONTERAS Q1 Y FÍSICA AVANZADA */}
        {isMatch('q1ResearchSuite') && (
          <Q1ResearchSuiteModal
            key="q1-suite"
            isOpen={true}
            onClose={() => setActiveModal(null)}
            ambientTempC={data.temperatura_malaga}
            windSpeedMs={data.velocidad_viento_km_h / 3.6}
            relativeHumidity={data.humedad_relativa}
            no2BaseUgm3={activeNO2}
            o3BaseUgm3={activeO3}
            pm25BaseUgm3={activePM25}
            onFlyToLocation={(lat, lon, zoom, bearing) => flyToLocation(lat, lon, zoom, bearing)}
          />
        )}
        {isMatch('q1FrontiersSuite', 'd3_advection_diffusion_contour') && (
          <Q1FrontiersSuiteModal
            key="q1-frontiers-suite"
            isOpen={true}
            onClose={() => setActiveModal(null)}
            ambientTempC={data.temperatura_malaga}
            windSpeedMs={data.velocidad_viento_km_h / 3.6}
            relativeHumidity={data.humedad_relativa}
            no2BaseUgm3={activeNO2}
            o3BaseUgm3={activeO3}
            pm25BaseUgm3={activePM25}
            onFlyToLocation={(lat, lon, zoom, bearing) => flyToLocation(lat, lon, zoom, bearing)}
          />
        )}
        {isMatch('q1CoastalChemistry', 'coastalAtmosphericChemistry', 'coastal_halogen_clno2', 'seaSaltNitrate', 'marineNitratePartitioning', 'isorropiaSeaSalt', 'termodinamicaAerosolMarino', 'nitratoAerosolCostero') && (
          <Q1CoastalAtmosphericChemistryModal
            key="q1-coastal-atmospheric-chemistry"
            isOpen={true}
            onClose={() => setActiveModal(null)}
            ambientTempC={data.temperatura_malaga}
            windSpeedMs={data.velocidad_viento_km_h / 3.6}
            relativeHumidity={data.humedad_relativa}
            no2BaseUgm3={activeNO2}
            o3BaseUgm3={activeO3}
            pm25BaseUgm3={activePM25}
            onFlyToLocation={(lat, lon, zoom, bearing) => flyToLocation(lat, lon, zoom, bearing)}
          />
        )}
        {isMatch('q1MicroscalePhysics', 'wind_vector_advection') && (
          <Q1MicroscaleAtmosphericPhysicsModal
            key="q1-microscale-atmospheric-physics"
            isOpen={true}
            onClose={() => setActiveModal(null)}
            ambientTempC={data.temperatura_malaga}
            windSpeedMs={data.velocidad_viento_km_h / 3.6}
            relativeHumidity={data.humedad_relativa}
            no2BaseUgm3={activeNO2}
            o3BaseUgm3={activeO3}
            onFlyToLocation={(lat, lon, zoom, bearing) => flyToLocation(lat, lon, zoom, bearing)}
          />
        )}
        {isMatch('advancedEnginesSuite') && (
          <AdvancedEnginesSuiteModal
            key="advanced-engines-suite"
            isOpen={true}
            onClose={() => setActiveModal(null)}
            onFlyToLocation={(lat, lon, zoom, bearing) => flyToLocation(lat, lon, zoom, bearing)}
          />
        )}
        {isMatch('alboranCruiseAirport', 'alboranOceanography', 'alboranSea', 'alboran_marine_currents', 'cruisePlumeAirportControl') && (
          <AlboranSeaCruiseAirportControlModal
            key="alboran-cruise-airport-ctrl"
            onClose={() => setActiveModal(null)}
            ambientTempC={data.temperatura_malaga}
            relativeHumidity={data.humedad_relativa}
            windSpeedMS={data.velocidad_viento_km_h / 3.6}
            windDirectionDeg={data.direccion_viento_grados}
          />
        )}
        {isMatch('activePoint7DayHistory', 'pointAirQualityHistory', 'point7DayHistory', 'temporal_point_history_7d') && (
          <ActivePoint7DayHistoryModal
            key="active-point-7day-history"
            isOpen={true}
            onClose={() => setActiveModal(null)}
          />
        )}
        {isMatch('correlationScatterPlot', 'correlationScatter', 'd3ScatterPlot', 'scatterCorrelation', 'scatter_correlation', 'd3_scatter_plot') && (
          <ActivePointCorrelationScatterModal
            key="active-point-correlation-scatter"
            isOpen={true}
            onClose={() => setActiveModal(null)}
          />
        )}
        {isMatch('metrologicalCertificate', 'metrological_certificate', 'metrological-certificate', 'pointCertificate', 'point_certificate', 'point-metrological-certificate') && (
          <PointMetrologicalCertificateModal
            key="metrological-cert"
            isOpen={true}
            onClose={() => setActiveModal(null)}
          />
        )}
        {isMatch('microscaleComparator', 'microscale_comparator', 'bipunctualComparator', 'bipunctual_comparator') && (
          <BipunctualMicroscaleComparatorModal
            key="microscale-comp"
            isOpen={true}
            onClose={() => setActiveModal(null)}
            onNavigateToPoint={(pLat, pLon, pName) => flyToLocation(pLat, pLon, 16.5, 45)}
          />
        )}
        {isMatch('pythonJupyterNotebook', 'python_jupyter_notebook', 'pythonNotebook', 'python_notebook', 'jupyterNotebook', 'jupyter_notebook') && (
          <PythonJupyterNotebookModal
            key="python-jupyter-notebook"
            isOpen={true}
            onClose={() => setActiveModal(null)}
          />
        )}
        {isMatch('tropomiIntercomparison', 'tropomi_intercomparison', 'satellite_tropomi', 'tropomi') && (
          <TropomiIntercomparisonModal
            key="tropomi-intercomparison"
            isOpen={true}
            onClose={() => setActiveModal(null)}
          />
        )}
        {isMatch('acousticAtmosphericCorrelation', 'acoustic_atmospheric_correlation', 'acousticNoise', 'acoustic_noise', 'noiseCoexposure', 'noise_coexposure') && (
          <AcousticAtmosphericCorrelationModal
            key="acoustic-atmospheric-correlation"
            isOpen={true}
            onClose={() => setActiveModal(null)}
          />
        )}
        {isMatch('umaActinicJNo2', 'uma_actinic_jno2', 'umaActinic', 'uma_actinic', 'umaTeatinos', 'uma_teatinos') && (
          <UmaActinicJNo2Modal
            key="uma-actinic-jno2"
            isOpen={true}
            onClose={() => setActiveModal(null)}
          />
        )}
        {isMatch('ieoCoastalTibl', 'ieo_coastal_tibl', 'ieoTibl', 'ieo_tibl', 'coastalTibl', 'coastal_tibl', 'maretoTibl', 'mareto_tibl') && (
          <IeoCoastalTiblModal
            key="ieo-coastal-tibl"
            isOpen={true}
            onClose={() => setActiveModal(null)}
          />
        )}
        {isMatch('ihsmBiogenicSoa', 'ihsm_biogenic_soa', 'ihsmSoa', 'ihsm_soa', 'laMayoraSoa', 'la_mayora_soa', 'biogenicSoa', 'biogenic_soa') && (
          <IhsmBiogenicSoaModal
            key="ihsm-biogenic-soa"
            isOpen={true}
            onClose={() => setActiveModal(null)}
          />
        )}
        {isMatch('verticalLidarRadar', 'vertical_lidar_radar', 'caliopRadar', 'caliop_radar', 'lidarRadar', 'lidar_radar', 'caliopLidar', 'caliop_lidar') && (
          <VerticalLidarRadarModal
            key="vertical-lidar-radar"
            isOpen={true}
            onClose={() => setActiveModal(null)}
          />
        )}
        {isMatch('icrp66Dosimetry', 'icrp66_dosimetry', 'icrp66', 'lungDosimetry', 'lung_dosimetry', 'directive2024Audit', 'directive_2024_audit', 'directive2024_2881') && (
          <Icrp66DosimetryModal
            key="icrp66-dosimetry"
            isOpen={true}
            onClose={() => setActiveModal(null)}
          />
        )}
        {isMatch('fourDVarVsEnkf', 'four_d_var_vs_enkf', 'fourDVar', 'four_d_var', '4dvar', '4dvarEnkf', '4dvar_enkf') && (
          <FourDVarVsEnkfModal
            key="four-d-var-vs-enkf"
            isOpen={true}
            onClose={() => setActiveModal(null)}
          />
        )}
        {isMatch('w3cProvPassport', 'w3c_prov_passport', 'w3c_prov', 'cryptographicProvenance', 'sha256Passport', 'provPassport') && (
          <W3cProvPassportModal
            key="w3c-prov-passport"
            isOpen={true}
            onClose={() => setActiveModal(null)}
          />
        )}
        {isMatch('huntQCriterion', 'hunt_q_criterion', 'huntQ', 'hunt_q', 'qCriterion', 'q_criterion', 'vortexQ') && (
          <HuntQCriterionModal
            key="hunt-q-criterion"
            isOpen={true}
            onClose={() => setActiveModal(null)}
          />
        )}
        {isMatch('marineNitrogenDeposition', 'marine_nitrogen_deposition', 'marineDeposition', 'marine_deposition', 'ieoNitrogen', 'ieo_nitrogen', 'bayDeposition') && (
          <MarineNitrogenDepositionModal
            key="marine-nitrogen-deposition"
            isOpen={true}
            onClose={() => setActiveModal(null)}
          />
        )}
        {isMatch('zbeDualSpilloverHalo', 'zbe_dual_spillover_halo', 'zbeSpilloverHalo', 'zbe_spillover_halo', 'zbeHalo', 'zbe_halo', 'zbeSpillover') && (
          <ZbeDualSpilloverHaloModal
            key="zbe-dual-spillover-halo"
            isOpen={true}
            onClose={() => setActiveModal(null)}
          />
        )}
        {isMatch('environmentalJustice', 'environmental_justice', 'justiciaAmbiental', 'justicia_ambiental', 'ineJustice', 'kakwaniAtkinson', 'lorenzAmbiental') && (
          <EnvironmentalJusticeModal
            key="environmental-justice"
            isOpen={true}
            onClose={() => setActiveModal(null)}
            initialTab={
              (extractSubtab(activeModal) as any) ||
              (isMatch('kakwaniAtkinson', 'lorenzAmbiental') ? 'lorenz_metrics' : 'zbe_rebound_proximity')
            }
          />
        )}
        {isMatch('schoolAirEquity', 'school_air_equity', 'schoolStreets', 'school_streets', 'entornosEscolares', 'entornos_escolares', 'pediatricAir', 'pediatricDosimetry') && (
          <SchoolAirEquityModal
            key="school-air-equity"
            isOpen={true}
            onClose={() => setActiveModal(null)}
            initialSubtab={
              (extractSubtab(activeModal) as any) ||
              (isMatch('pediatricAir', 'pediatricDosimetry') ? 'dosimetry' : 'directive2024')
            }
          />
        )}
        {isMatch('healthEconomicsSas', 'health_economics_sas', 'healthEconomics', 'health_economics', 'costBenefitSas', 'cost_benefit_sas', 'vslMalaga', 'vsl_malaga') && (
          <HealthEconomicsSasModal
            key="health-economics-sas"
            isOpen={true}
            onClose={() => setActiveModal(null)}
          />
        )}
        {isMatch('greenJustice330300', 'green_justice_330300', 'regla330300', 'regla_3_30_300', 'greenEquity', 'green_equity', 'desiertosVerdes', 'desiertos_verdes') && (
          <GreenJustice330300Modal
            key="green-justice-330300"
            isOpen={true}
            onClose={() => setActiveModal(null)}
          />
        )}
        {isMatch('coastalSmlAcidification', 'coastal_sml_acidification', 'smlAcidification', 'sml_acidification', 'acidificacionMarina', 'acidificacion_marina', 'puertoAcidificacion') && (
          <CoastalSmlAcidificationModal
            key="coastal-sml-acidification"
            isOpen={true}
            onClose={() => setActiveModal(null)}
          />
        )}
        {isMatch('quickLauncher') && (
          <QuickModuleLauncherModal
            key="quick-launcher"
            isOpen={true}
            onClose={() => setActiveModal(null)}
            onSelectModule={(mId) => setActiveModal(mId)}
          />
        )}
        {isMatch('userGuide', 'guide', 'guia', 'guía', 'user_guide', 'guiaUsuario', 'guia_usuario', 'guiaMetodologica') && (
          <UserGuideTourModal
            key="user-guide"
            isOpen={true}
            onClose={() => setActiveModal(null)}
            setActiveModal={setActiveModal}
            flyToLocation={(lat, lon, zoom, pitch) => flyToLocation(lat, lon, zoom, pitch)}
            applyCameraPreset={applyCameraPreset || (() => {})}
          />
        )}
        {isMatch('activePointAudioNarrator', 'audioNarrator', 'audionarracion', 'audionarracionPuntoActivo', 'pointAudioNarrator', 'slideTribunal', 'doctoralSlide', 'slideDeTribunal') && (
          <ActivePointAudioNarratorModal
            key="active-point-audio-narrator"
            initialTab={['slideTribunal', 'doctoralSlide', 'slideDeTribunal'].includes(activeModal || '') ? 'slide_tribunal' : 'chapters'}
            onClose={() => setActiveModal(null)}
          />
        )}
        {isMatch('systemIntegrityAudit', 'system_integrity_audit', 'auditIntegrity', 'integrityAudit', 'verificacionSistemica', 'verificacion_sistemica', 'systemAudit') && (
          <SystemIntegrityAuditModal
            key="system-integrity-audit"
            onClose={() => setActiveModal(null)}
          />
        )}
        {isMatch('telemetryProvenanceTracker', 'telemetry_provenance_tracker', 'telemetryProvenance', 'provenanceTracker', 'trazabilidadTelemetrica', 'provenanceAudit') && (
          <TelemetryProvenanceTracker
            key="telemetry-provenance-tracker"
            onClose={() => setActiveModal(null)}
          />
        )}
        {isMatch('no2MassBudget', 'no2_mass_budget', 'no2MassBudgetWaterfall', 'no2_mass_budget_waterfall', 'balanceMasaNo2', 'balance_masa_no2', 'no2Waterfall', 'no2_waterfall', 'no2ContinuityBudget', 'no2Isotopes', 'isotopeForensics', 'delta15N', 'forenseIsotopico') && (
          <NO2MassBudgetWaterfallModal
            key="no2-mass-budget-waterfall"
            onClose={() => setActiveModal(null)}
            initialTab={
              extractSubtab(activeModal) === 'isotopes' || 
              extractSubtab(targetModal) === 'isotopes' ||
              activeModal?.toLowerCase().includes('isotope') || 
              activeModal?.toLowerCase().includes('delta15n') || 
              activeModal?.toLowerCase().includes('forense') 
                ? 'isotopes' 
                : 'waterfall'
            }
          />
        )}
        {isMatch('no2NighttimeChemistry', 'no2_nighttime_chemistry', 'nighttimeChemistry', 'no3RadicalChemistry', 'clno2Chemistry', 'quimicaNocturnaNo2', 'quimica_nocturna_no2') && (
          <NO2NighttimeChemistryModal
            key="no2-nighttime-chemistry"
            onClose={() => setActiveModal(null)}
          />
        )}
        {isMatch('inverseSourceRate', 'inverse_source_rate', 'inverseSourceEmission', 'inverse_source_emission', 'qNOxInverse', 'tasaEmisionInversa', 'tasa_emision_inversa') && (
          <InverseSourceRateEstimationModal
            key="inverse-source-rate-estimation"
            onClose={() => setActiveModal(null)}
          />
        )}
        {isMatch('weselyDryDeposition', 'wesely_dry_deposition_modal', 'weselyDeposition', 'wesely_deposition', 'wesely', 'wesely_dry_deposition', 'terralMicrophysics', 'terral_microphysics', 'terralGuadalhorce', 'terral_guadalhorce', 'terralWesely', 'terral') && (
          <WeselyDryDepositionModal
            key="wesely-dry-deposition"
            onClose={() => setActiveModal(null)}
            initialTab={
              extractSubtab(activeModal) === 'microfisica_terral' || 
              extractSubtab(targetModal) === 'microfisica_terral' ||
              activeModal?.toLowerCase().includes('terral') ||
              activeModal?.toLowerCase().includes('foehn')
                ? 'microfisica_terral'
                : extractSubtab(activeModal) === 'especies_arboleas' ||
                  extractSubtab(targetModal) === 'especies_arboleas' ||
                  activeModal?.toLowerCase().includes('arbol') ||
                  activeModal?.toLowerCase().includes('flora')
                ? 'especies_arboleas'
                : 'modelo_wesely'
            }
          />
        )}
        {isMatch('portableCloudSync', 'portable_cloud_sync', 'cloudSyncUsb', 'cloud_sync_usb') && (
          <PortableCloudSyncModal
            key="portable-cloud-sync-modal"
            onClose={() => setActiveModal(null)}
            onOpenModal={(id) => setActiveModal(id)}
          />
        )}

        {/* FALLBACK UNIVERSAL: Garantiza que cualquier identificador o incorporación futura jamás quede inactivo */}
        {activeModal && (() => {
          const norm = normalizeModalId(activeModal);
          const rawBase = activeModal.split(':')[0];
          const normBase = norm.split(':')[0];
          const isHandled = KNOWN_MODAL_IDS.has(activeModal) || KNOWN_MODAL_IDS.has(norm) || KNOWN_MODAL_IDS.has(rawBase) || KNOWN_MODAL_IDS.has(normBase);
          if (isHandled) return null;
          return (
            <ScientificModalFallback
              key={`fallback-${activeModal}`}
              modalId={activeModal}
              onClose={() => setActiveModal(null)}
              setActiveModal={setActiveModal}
            />
          );
        })()}
      </AnimatePresence>
    </Suspense>
    </SectionErrorBoundary>
  );
};

export const ScientificModalRegistry = React.memo<ScientificModalRegistryProps>(
  ScientificModalRegistryBase,
  (prevProps, nextProps) => {
    // 1. If closed in both, prevent re-render entirely
    if (!prevProps.activeModal && !nextProps.activeModal) {
      return true;
    }

    // 2. Active modal changed
    if (prevProps.activeModal !== nextProps.activeModal) {
      return false;
    }

    // 3. Meteorological data or physics result changed
    if (prevProps.data !== nextProps.data) return false;
    if (prevProps.result !== nextProps.result) return false;

    // 4. Station comparisons or telemetry audit changed
    if (prevProps.stationComparisons !== nextProps.stationComparisons) return false;
    if (prevProps.telemetryAudit !== nextProps.telemetryAudit) return false;
    if (prevProps.isRetesting !== nextProps.isRetesting) return false;

    // 5. Geographic location coordinate changed (latitude/longitude)
    if (
      prevProps.location.lat !== nextProps.location.lat ||
      prevProps.location.lon !== nextProps.location.lon
    ) {
      return false;
    }

    // 6. Tree street selection changed
    if (prevProps.selectedTreeStreetId !== nextProps.selectedTreeStreetId) return false;
    if (prevProps.treeModalInitialTab !== nextProps.treeModalInitialTab) return false;

    // 7. Base map style or 3D layer modes changed
    if (prevProps.is3DMode !== nextProps.is3DMode) return false;
    if (prevProps.activeBaseStyle !== nextProps.activeBaseStyle) return false;
    if (prevProps.showBuildings !== nextProps.showBuildings) return false;
    if (prevProps.showWindParticles !== nextProps.showWindParticles) return false;
    if (prevProps.showDeckGLMesh !== nextProps.showDeckGLMesh) return false;

    // 8. DeckGL settings changed
    if (prevProps.deckGlActiveSpecies !== nextProps.deckGlActiveSpecies) return false;
    if (prevProps.deckGlMultiLayerMode !== nextProps.deckGlMultiLayerMode) return false;
    if (prevProps.deckGlElevationScale !== nextProps.deckGlElevationScale) return false;
    if (prevProps.deckGlColumnRadius !== nextProps.deckGlColumnRadius) return false;
    if (prevProps.deckGlDiskResolution !== nextProps.deckGlDiskResolution) return false;
    if (prevProps.deckGlWireframe !== nextProps.deckGlWireframe) return false;
    if (prevProps.deckGlOpacity !== nextProps.deckGlOpacity) return false;
    if (prevProps.instancedBuffers !== nextProps.instancedBuffers) return false;

    // Camera bearing and pitch updates in parent App do NOT affect modals!
    return true;
  }
);
