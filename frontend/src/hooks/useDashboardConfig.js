// Ruta: src/hooks/useDashboardConfig.js
import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import authService from '../services/auth.service';
import { arrayMove } from '@dnd-kit/sortable';

const MAX_SUMMARY_CARDS_DISPLAY = 5; 

const initializeWidgetStructure = (order, allWidgetsMap) => {
  const widgetList = [];
  const includedInOrder = new Set();

  if (order && order.length > 0) {
    order.forEach(id => {
      if (allWidgetsMap[id]) {
        widgetList.push({
          id,
          name: allWidgetsMap[id].name,
          Component: allWidgetsMap[id].Component,
          props: { ...allWidgetsMap[id].defaultProps, loading: true }
        });
        includedInOrder.add(id);
      }
    });
  }
  Object.keys(allWidgetsMap).forEach(id => {
    if (!includedInOrder.has(id) && allWidgetsMap[id]) {
      widgetList.push({
        id,
        name: allWidgetsMap[id].name,
        Component: allWidgetsMap[id].Component,
        props: { ...allWidgetsMap[id].defaultProps, loading: true }
      });
    }
  });
  return widgetList;
};

export const useDashboardConfig = (ALL_AVAILABLE_WIDGETS, getDefaultWidgetOrderFunc, allUserAccountsFromApi) => {
  const { user, updateUserInContext } = useAuth();

  const [masterWidgetOrder, setMasterWidgetOrder] = useState([]);
  const [visibleWidgetIds, setVisibleWidgetIds] = useState([]);
  const [displayedAccountIds, setDisplayedAccountIds] = useState([]);
  const [orderedVisibleWidgetsList, setOrderedVisibleWidgetsList] = useState([]);
  
  const [configError, setConfigError] = useState('');
  const [isInitialConfigLoaded, setIsInitialConfigLoaded] = useState(false); 

  const prevMasterWidgetOrderRef = useRef();
  const prevVisibleWidgetIdsRef = useRef();
  const prevOrderedVisibleWidgetsListRef = useRef(); // Nombre correcto de la ref

  useEffect(() => { prevMasterWidgetOrderRef.current = masterWidgetOrder; }, [masterWidgetOrder]);
  useEffect(() => { prevVisibleWidgetIdsRef.current = visibleWidgetIds; }, [visibleWidgetIds]);
  useEffect(() => { prevOrderedVisibleWidgetsListRef.current = orderedVisibleWidgetsList; }, [orderedVisibleWidgetsList]);


  useEffect(() => {
    if (user && !isInitialConfigLoaded) {
      // console.log('[useDashboardConfig] Initializing config...');
      let initialMasterOrder = getDefaultWidgetOrderFunc();
      let initialVisible = getDefaultWidgetOrderFunc(); 
      let initialDisplayedAcc = [];

      if (user.dashboardConfig) {
        initialMasterOrder = user.dashboardConfig.widgetOrder && user.dashboardConfig.widgetOrder.length > 0
          ? user.dashboardConfig.widgetOrder
          : getDefaultWidgetOrderFunc();
        
        const allWidgetKeys = Object.keys(ALL_AVAILABLE_WIDGETS);
        const currentOrderSet = new Set(initialMasterOrder);
        allWidgetKeys.forEach(key => {
            if (!currentOrderSet.has(key)) {
                initialMasterOrder.push(key);
            }
        });
        
        initialVisible = user.dashboardConfig.visibleWidgetIds && user.dashboardConfig.visibleWidgetIds.length > 0
          ? user.dashboardConfig.visibleWidgetIds
          : initialMasterOrder; 
        
        initialDisplayedAcc = user.dashboardConfig.displayedAccountIds || [];

      } else if (allUserAccountsFromApi && allUserAccountsFromApi.length > 0) {
        initialDisplayedAcc = allUserAccountsFromApi
          .filter(acc => acc.includeInDashboardSummary)
          .slice(0, MAX_SUMMARY_CARDS_DISPLAY)
          .map(acc => acc.id.toString());
      }
      
      setMasterWidgetOrder(initialMasterOrder);
      setVisibleWidgetIds(initialVisible);
      setDisplayedAccountIds(initialDisplayedAcc);
      setIsInitialConfigLoaded(true); 

      if (!user.dashboardConfig) {
        // console.log('[useDashboardConfig] No backend config, saving defaults.');
         authService.updateUserDashboardConfig({
            widgetOrder: initialMasterOrder,
            visibleWidgetIds: initialVisible,
            displayedAccountIds: initialDisplayedAcc,
          })
          .then(response => updateUserInContext({ dashboardConfig: response.dashboardConfig }))
          .catch(err => {
            console.error("useDashboardConfig: Error guardando config inicial:", err);
            setConfigError("No se pudo guardar la configuración inicial del dashboard.");
          });
      }
    }
  }, [user, allUserAccountsFromApi, getDefaultWidgetOrderFunc, updateUserInContext, isInitialConfigLoaded, ALL_AVAILABLE_WIDGETS]);

  const saveConfig = useCallback(async () => {
    if (!user || !isInitialConfigLoaded) {
        return;
    } 
    
    setConfigError('');
    const newConfig = { 
        widgetOrder: masterWidgetOrder, 
        visibleWidgetIds, 
        displayedAccountIds 
    };

    const currentBackendConfig = user.dashboardConfig || {};
    const orderChanged = JSON.stringify(currentBackendConfig.widgetOrder || []) !== JSON.stringify(masterWidgetOrder);
    const visibleChanged = JSON.stringify((currentBackendConfig.visibleWidgetIds || []).sort()) !== JSON.stringify(visibleWidgetIds.sort());
    const displayedAccChanged = JSON.stringify((currentBackendConfig.displayedAccountIds || []).sort()) !== JSON.stringify(displayedAccountIds.sort());

    if (!orderChanged && !visibleChanged && !displayedAccChanged) {
        return;
    }
    // console.log('[useDashboardConfig] saveConfig: Attempting to save changes.');
    try {
      const response = await authService.updateUserDashboardConfig(newConfig);
      updateUserInContext({ dashboardConfig: response.dashboardConfig });
    } catch (err) {
      console.error("useDashboardConfig: Error guardando config:", err);
      setConfigError("No se pudo guardar la configuración del dashboard.");
    }
  }, [user, masterWidgetOrder, visibleWidgetIds, displayedAccountIds, updateUserInContext, isInitialConfigLoaded]);

  useEffect(() => {
    if (isInitialConfigLoaded) {
      saveConfig();
    }
  }, [masterWidgetOrder, visibleWidgetIds, displayedAccountIds, saveConfig, isInitialConfigLoaded]);

  useEffect(() => {
    if (isInitialConfigLoaded) {
      // console.log('[useDashboardConfig] masterWidgetOrder or visibleWidgetIds changed, recomputing orderedVisibleWidgetsList.');
      const fullWidgetList = initializeWidgetStructure(masterWidgetOrder, ALL_AVAILABLE_WIDGETS);
      const filteredAndOrdered = fullWidgetList.filter(widget => visibleWidgetIds.includes(widget.id));
      
      const finalOrderedVisibleList = [];
      masterWidgetOrder.forEach(masterId => {
          const foundWidget = filteredAndOrdered.find(w => w.id === masterId);
          if (foundWidget) {
              finalOrderedVisibleList.push(foundWidget);
          }
      });

      // *** CORRECCIÓN DEL TYPO AQUÍ ***
      if (prevOrderedVisibleWidgetsListRef.current && JSON.stringify(prevOrderedVisibleWidgetsListRef.current) === JSON.stringify(finalOrderedVisibleList)) {
        // console.log('[useDashboardConfig] orderedVisibleWidgetsList content is the same, not updating state reference.');
      } else {
        // console.log('[useDashboardConfig] orderedVisibleWidgetsList content CHANGED, updating state reference.');
        setOrderedVisibleWidgetsList(finalOrderedVisibleList);
      }
    }
  }, [masterWidgetOrder, visibleWidgetIds, ALL_AVAILABLE_WIDGETS, isInitialConfigLoaded]);


  const handleDragEndDnd = (event) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      // console.log('[useDashboardConfig] handleDragEndDnd: Reordering masterWidgetOrder.');
      setMasterWidgetOrder((prevOrder) => {
        const oldIndex = prevOrder.findIndex(id => id === active.id);
        const newIndex = prevOrder.findIndex(id => id === over.id);
        if (oldIndex === -1 || newIndex === -1) return prevOrder;
        return arrayMove(prevOrder, oldIndex, newIndex);
      });
    }
  };

  const handleSaveWidgetSelections = (newVisibleIds) => {
    // console.log('[useDashboardConfig] handleSaveWidgetSelections: Updating visibleWidgetIds.');
    setVisibleWidgetIds(newVisibleIds);
  };

  const handleSaveAccountSelections = (newDisplayedAccIds) => {
    // console.log('[useDashboardConfig] handleSaveAccountSelections: Updating displayedAccountIds.');
    setDisplayedAccountIds(newDisplayedAccIds);
  };

  // useEffect(() => {
  //   if (prevMasterWidgetOrderRef.current && prevMasterWidgetOrderRef.current !== masterWidgetOrder) console.log('[useDashboardConfig] masterWidgetOrder reference CHANGED.');
  // }, [masterWidgetOrder]);
  // useEffect(() => {
  //   if (prevVisibleWidgetIdsRef.current && prevVisibleWidgetIdsRef.current !== visibleWidgetIds) console.log('[useDashboardConfig] visibleWidgetIds reference CHANGED.');
  // }, [visibleWidgetIds]);
  //  useEffect(() => {
  //   if (prevOrderedVisibleWidgetsListRef.current && prevOrderedVisibleWidgetsListRef.current !== orderedVisibleWidgetsList) console.log('[useDashboardConfig] orderedVisibleWidgetsList reference CHANGED.');
  // }, [orderedVisibleWidgetsList]);


  return {
    masterWidgetOrder, 
    orderedVisibleWidgetsList, 
    visibleWidgetIds,
    displayedAccountIds,
    configError,
    isInitialConfigLoaded, 
    
    handleDragEndDnd,
    handleSaveWidgetSelections,
    handleSaveAccountSelections,
  };
};
