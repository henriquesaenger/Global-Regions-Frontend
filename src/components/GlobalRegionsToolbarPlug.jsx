import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useDispatch } from "react-redux";
import { Plug } from "@plone/volto/components/manage/Pluggable";
import Sidebar from "@plone/volto/components/manage/Sidebar/Sidebar";
import Icon from "@plone/volto/components/theme/Icon/Icon";
import { setSidebarTab } from "@plone/volto/actions/sidebar/sidebar";
import { useGlobalRegions } from "../context/GlobalRegionsContext";

export const GlobalRegionsSidebar = () => {
  const { editingRegion } = useGlobalRegions();
  const dispatch = useDispatch();
  const [portalHost, setPortalHost] = useState(null);

  useEffect(() => {
    setPortalHost(document.getElementById("sidebar"));
  }, []);

  useEffect(() => {
    if (editingRegion) dispatch(setSidebarTab(0));
  }, [dispatch, editingRegion]);

  if (!editingRegion || !portalHost) return null;

  return createPortal(
    <Sidebar documentTab={false} blockTab orderTab settingsTab={false} />,
    portalHost,
  );
};

const GlobalRegionsToolbarPlug = ({
  id = "global-regions-edit",
  pluggable = "main.toolbar.top",
  morePluggable = "toolbar-more-menu-list",
  region,
  icon,
  label = "Edit global region",
  initializeLabel = "Initialize global region",
  cancelLabel = "Cancel global region editing",
  visible = true,
  requireEditPermission = false,
  renderControl,
  order,
}) => {
  const globalRegions = useGlobalRegions();
  const regionName = region || globalRegions.activeRegionName;
  const initialized =
    globalRegions.regions?.[regionName] !== null &&
    globalRegions.regions?.[regionName] !== undefined;
  const editing = globalRegions.editingRegion === regionName;
  const handleClick = () => {
    if (editing) {
      globalRegions.cancelEditing();
    } else {
      globalRegions.beginEditing(regionName);
    }
  };

  if (!visible || (requireEditPermission && !globalRegions.canEdit)) {
    return null;
  }

  if (globalRegions.editingRegion) {
    return null;
  }

  const text = editing ? cancelLabel : initialized ? label : initializeLabel;
  const control = renderControl ? (
    renderControl({
      ...globalRegions,
      editing,
      icon,
      onClick: handleClick,
      regionName,
    })
  ) : (
    <button
      type="button"
      className={
        "global-regions-toolbar-button " + (icon ? "has-icon" : "has-label")
      }
      aria-label={text}
      aria-pressed={editing}
      onClick={handleClick}
      disabled={globalRegions.saving}
    >
      {icon ? <Icon name={icon} size="30px" title={text} /> : text}
    </button>
  );

  return (
    <>
      <Plug
        pluggable={pluggable}
        id={`${id}-${regionName}`}
        dependencies={[editing, icon, regionName, globalRegions.saving, text]}
        name={id}
        order={order}
      >
        {control}
      </Plug>
      {morePluggable && (
        <Plug
          pluggable={morePluggable}
          id={`${id}-more-${regionName}`}
          dependencies={[editing, regionName, globalRegions.saving, text]}
          name={`${id}-more`}
          order={order}
        >
          <li className="global-regions-more-item">
            <button
              type="button"
              aria-pressed={editing}
              onClick={handleClick}
              disabled={globalRegions.saving}
            >
              {text}
            </button>
          </li>
        </Plug>
      )}
    </>
  );
};

export default GlobalRegionsToolbarPlug;
