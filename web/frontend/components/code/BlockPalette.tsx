"use client";

import {
  BlockCategory,
  blockCategories,
  blocks,
} from "./blocks/blockDefinitions";

type Props = {
  category: BlockCategory;
};

export default function BlockPalette({
  category,
}: Props) {
  const categoryData =
    blockCategories.find(
      (item) => item.id === category
    );

  const visibleBlocks =
    blocks.filter(
      (block) => block.category === category
    );

  return (
    <aside className="codeBlockPalette">

      <h2>
        {categoryData?.label}
      </h2>

      <div className="codePaletteBlocks">

        {visibleBlocks.map((block) => (
          <div
            key={block.id}
            className={`
              scratchBlock
              scratchBlock-${block.type}
            `}
            style={{
              backgroundColor:
                categoryData?.color,
            }}
          >
            {block.label}
          </div>
        ))}

      </div>

    </aside>
  );
}