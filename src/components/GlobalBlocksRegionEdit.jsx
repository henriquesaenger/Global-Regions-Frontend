import React, { useEffect, useMemo, useState } from "react";
import { useDispatch } from "react-redux";
import { Button } from "semantic-ui-react";
import { BlocksForm } from "@plone/volto/components/manage/Form";
import { Plug } from "@plone/volto/components/manage/Pluggable";
import EditBlockWrapper from "@plone/volto/components/manage/Blocks/Block/EditBlockWrapper";
import Icon from "@plone/volto/components/theme/Icon/Icon";
import {
  emptyBlocksForm,
  blockHasValue,
} from "@plone/volto/helpers/Blocks/Blocks";
import { setUIState } from "@plone/volto/actions/form/form";
import config from "@plone/volto/registry";
import saveSVG from "@plone/volto/icons/save.svg";
import clearSVG from "@plone/volto/icons/clear.svg";
import { useGlobalRegions } from "../context/GlobalRegionsContext";
import {
  createGlobalRegion,
  createRegionFromDefinition,
  isEmptyGlobalRegion,
  normalizeGlobalRegion,
  resolveGlobalRegion,
  resolveGlobalRegionName,
} from "../helpers/globalRegions";

const createEditingRegion = (region, definition) => {
  const configuredRegion = isEmptyGlobalRegion(region)
    ? createRegionFromDefinition(definition)
    : createGlobalRegion(region);

  return isEmptyGlobalRegion(configuredRegion)
    ? emptyBlocksForm()
    : configuredRegion;
};

const normalizeEditingRegion = (region, definition) => {
  const allowedBlocks = definition.allowedBlocks;

  if (!Array.isArray(allowedBlocks)) {
    return normalizeGlobalRegion(region, definition);
  }

  const items = region.blocks_layout?.items || [];
  const containsConfiguredBlock = items.some((id) =>
    allowedBlocks.includes(region.blocks?.[id]?.["@type"]),
  );

  return normalizeGlobalRegion(
    region,
    containsConfiguredBlock
      ? definition
      : {
          ...definition,
          allowedBlocks: [
            ...new Set([...allowedBlocks, config.settings.defaultBlockType]),
          ],
        },
  );
};

const GlobalBlocksRegionEdit = ({
  name,
  pathname = "/",
  allowedBlocks,
  maxLength,
  blocksConfig,
  className,
  metadata,
  saveLabel = "Save",
  cancelLabel = "Cancel",
  onSave,
  onCancel,
}) => {
  const dispatch = useDispatch();
  const globalRegions = useGlobalRegions();
  const regionName = resolveGlobalRegionName(
    globalRegions.regions,
    name || globalRegions.activeRegionName,
    globalRegions.definitions,
  );
  const definition = globalRegions.definitions[regionName] || {};
  const storedRegion = useMemo(
    () =>
      resolveGlobalRegion(
        globalRegions.regions,
        regionName,
        globalRegions.definitions,
      ),
    [globalRegions.definitions, globalRegions.regions, regionName],
  );
  const effectiveDefinition = useMemo(
    () => ({
      ...definition,
      allowedBlocks: allowedBlocks ?? definition.allowedBlocks,
      maxLength: maxLength ?? definition.maxLength,
    }),
    [allowedBlocks, definition, maxLength],
  );
  const initialRegion = useMemo(
    () => createEditingRegion(storedRegion, effectiveDefinition),
    [effectiveDefinition, regionName, storedRegion],
  );
  const [draft, setDraft] = useState(() => initialRegion);
  const [selectedBlock, setSelectedBlock] = useState(
    initialRegion.blocks_layout.items[0] || null,
  );
  const [orderSidebarReady, setOrderSidebarReady] = useState(false);
  const items = draft.blocks_layout.items;
  const configuredItems = Array.isArray(effectiveDefinition.allowedBlocks)
    ? items.filter((id) =>
        effectiveDefinition.allowedBlocks.includes(draft.blocks[id]?.["@type"]),
      )
    : items;
  const hasOnlyEmptyPlaceholder =
    items.length === 1 &&
    draft.blocks[items[0]]?.["@type"] === config.settings.defaultBlockType &&
    !blockHasValue(draft.blocks[items[0]]);
  const maxLengthReached =
    Number.isInteger(effectiveDefinition.maxLength) &&
    configuredItems.length >= effectiveDefinition.maxLength;

  useEffect(() => {
    setDraft(initialRegion);
    const initialBlock = initialRegion.blocks_layout.items[0] || null;
    setSelectedBlock(initialBlock);
    dispatch(
      setUIState({
        selected: initialBlock,
        multiSelected: [],
        gridSelected: null,
      }),
    );
  }, [dispatch, initialRegion, regionName]);

  useEffect(() => {
    if (typeof document === "undefined") return undefined;

    const findOrderSidebar = () => {
      const ready = Boolean(document.getElementById("sidebar-order"));
      setOrderSidebarReady(ready);
      return ready;
    };

    if (findOrderSidebar()) return undefined;

    const observer = new MutationObserver(() => {
      if (findOrderSidebar()) observer.disconnect();
    });
    observer.observe(document.body, { childList: true, subtree: true });

    return () => observer.disconnect();
  }, [regionName]);

  const updateDraft = (nextDraft) => {
    const normalized = normalizeEditingRegion(nextDraft, effectiveDefinition);
    setDraft(normalized);
    if (
      selectedBlock &&
      !normalized.blocks_layout.items.includes(selectedBlock)
    ) {
      setSelectedBlock(normalized.blocks_layout.items[0] || null);
    }
  };

  const selectBlock = (block) => {
    setSelectedBlock(block);
    dispatch(
      setUIState({
        selected: block,
        multiSelected: [],
        gridSelected: null,
      }),
    );
  };

  const handleSave = async () => {
    const region = normalizeGlobalRegion(draft, effectiveDefinition);
    await globalRegions.saveRegion(regionName, region);
    globalRegions.cancelEditing();
    onSave?.(region, regionName);
  };

  const handleCancel = () => {
    setDraft(initialRegion);
    globalRegions.cancelEditing();
    onCancel?.(regionName);
  };

  const regionBlocksConfig =
    blocksConfig ||
    effectiveDefinition.blocksConfig ||
    config.blocks.blocksConfig;

  return (
    <>
      <Plug
        pluggable="main.toolbar.top"
        id={"global-regions-editor-actions-" + regionName}
        dependencies={[
          draft,
          globalRegions.saving,
          regionName,
          saveLabel,
          cancelLabel,
        ]}
        name="global-regions-editor-actions"
        order={0}
      >
        <Button
          id="toolbar-save"
          className="save"
          aria-label={saveLabel}
          onClick={handleSave}
          disabled={globalRegions.saving}
          loading={globalRegions.saving}
        >
          <Icon
            name={saveSVG}
            className="circled"
            size="30px"
            title={saveLabel}
          />
        </Button>
        <Button
          type="button"
          id="toolbar-cancel"
          className="cancel"
          aria-label={cancelLabel}
          onClick={handleCancel}
          disabled={globalRegions.saving}
        >
          <Icon
            name={clearSVG}
            className="circled"
            size="30px"
            title={cancelLabel}
          />
        </Button>
      </Plug>
      <section
        className={
          className ||
          `global-blocks-region global-blocks-region-${regionName} is-editing`
        }
        data-global-region={regionName}
      >
        <div className="global-blocks-region-edit-heading">
          <div className="global-blocks-region-edit-copy">
            <strong>{effectiveDefinition.title || regionName}</strong>
            <p>
              {effectiveDefinition.description ||
                "Alterações nesta região afetam todas as páginas do site."}
            </p>
          </div>
        </div>
        <div className="global-blocks-region-canvas">
          <BlocksForm
            properties={draft}
            metadata={{
              ...draft,
              ...(metadata || {}),
            }}
            pathname={pathname}
            selectedBlock={selectedBlock}
            multiSelected={[]}
            allowedBlocks={effectiveDefinition.allowedBlocks || undefined}
            showRestricted
            blocksConfig={regionBlocksConfig}
            isMainForm={orderSidebarReady}
            stopPropagation
            disableAddBlockOnEnterKey={
              maxLengthReached && !hasOnlyEmptyPlaceholder
            }
            onSelectBlock={selectBlock}
            onChangeFormData={updateDraft}
            onChangeField={(field, value) =>
              updateDraft({ ...draft, [field]: value })
            }
          >
            {(dragProps, editBlock, blockProps) => (
              <EditBlockWrapper
                draginfo={dragProps.draginfo}
                blockProps={{
                  ...blockProps,
                  showRestricted: true,
                  showBlockChooser:
                    (!maxLengthReached || hasOnlyEmptyPlaceholder) &&
                    blockProps.showBlockChooser,
                }}
              >
                {editBlock}
              </EditBlockWrapper>
            )}
          </BlocksForm>
        </div>
        {globalRegions.error && (
          <p className="global-blocks-region-error" role="alert">
            Não foi possível salvar a região global.
          </p>
        )}
      </section>
    </>
  );
};

export default GlobalBlocksRegionEdit;
