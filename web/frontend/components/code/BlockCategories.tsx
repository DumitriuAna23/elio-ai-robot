"use client";

import {
  BlockCategory,
  blockCategories,
} from "./blocks/blockDefinitions";

type Props = {
  activeCategory: BlockCategory;
  onCategoryChange: (category: BlockCategory) => void;
};

export default function BlockCategories({
  activeCategory,
  onCategoryChange,
}: Props) {
  return (
    <aside className="codeCategories">
      {blockCategories.map((category) => {
        const active =
          activeCategory === category.id;

        return (
          <button
            key={category.id}
            type="button"
            className={`codeCategory ${
              active ? "codeCategoryActive" : ""
            }`}
            onClick={() =>
              onCategoryChange(category.id)
            }
          >
            <span
              className="codeCategoryDot"
              style={{
                backgroundColor: category.color,
              }}
            />

            <span>{category.label}</span>
          </button>
        );
      })}
    </aside>
  );
}