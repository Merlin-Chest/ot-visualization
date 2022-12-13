import React, { FunctionComponent, useCallback, useEffect, useState } from "react";
import { createUseStyles } from "react-jss";
import clsx from "clsx";
import { Tooltip } from "@material-ui/core";
import { getClientColor } from "./sharedStyles";
import type { Operation, OperationWithoutPayload } from "./types/operation";
import { useOperationHoverState } from "./OperationHoverProvider";
import type { ApplicationSpecificOperationComponents } from "./types/applicationSpecific";

interface OperationWithOptionalRevision<OpT> extends Operation<OpT> {
  revision?: number;
}

const renderOperation = <OpT extends unknown>(
  renderOperation: (operation: OpT) => React.ReactNode,
  operation: OperationWithOptionalRevision<OpT>,
): JSX.Element => (
  <>
    {operation.revision !== undefined ? (
      <p style={{ textAlign: "center", fontWeight: "bold" }}>变更 {operation.revision}</p>
    ) : (
      <></>
    )}
    <div>{renderOperation(operation.base)}</div>
  </>
);

const useOperationStyles = createUseStyles({
  operation: {
    display: "inline-block",
    width: "20px",
    height: "20px",
    borderRadius: "10px",
  },
  tooltip: {
    // specificity hack
    "&$tooltip": {
      fontSize: "13px",
    },
  },
});

export type OperationTooltipPlacement = "top" | "bottom" | "left" | "right";

interface OperationProps<OpT>
  extends Omit<React.HTMLAttributes<HTMLSpanElement>, "onMouseEnter" | "onMouseLeave"> {
  operation: OperationWithOptionalRevision<OpT>;
  tooltipPlacement?: OperationTooltipPlacement;
}

const isOneArrayPrefixOfTheOther = (xs: string[], ys: string[]) => {
  const l = Math.min(xs.length, ys.length);
  for (let i = 0; i < l; i++) {
    if (xs[i] !== ys[i]) {
      return false;
    }
  }
  return true;
};

const isRelated = (a: OperationWithoutPayload, b: OperationWithoutPayload): boolean =>
  a.meta.id === b.meta.id;

const transformationPlural = (count: number): string => {
  switch (count) {
    case 1:
      return "一次";
    case 2:
      return "两次";
    case 3:
      return "三次";
    case 4:
      return "四次";
    case 5:
      return "五次";
    case 6:
      return "六次";
    case 7:
      return "七次";
    case 8:
      return "八次";
    case 9:
      return "九次";
    default:
      return "多次";
  }
};

const renderRelatedOperation = <OpT extends unknown>(
  operation: Operation<OpT>,
  relatedOperation: OperationWithoutPayload,
): NonNullable<React.ReactNode> => {
  if (
    isOneArrayPrefixOfTheOther(operation.transformedAgainst, relatedOperation.transformedAgainst)
  ) {
    const transformedAgainstDifference =
      operation.transformedAgainst.length - relatedOperation.transformedAgainst.length;
    if (transformedAgainstDifference < 0) {
      return `${transformationPlural(-transformedAgainstDifference)} 转化之前`;
    }
    if (transformedAgainstDifference > 0) {
      return `${transformationPlural(transformedAgainstDifference)} 转化之后`;
    }
    return "同一变更";
  }
  return "differently transformed";
};

enum SelfOpenStatus {
  Closed = "CLOSED",
  Closing = "CLOSING",
  Open = "OPEN",
}

export type OperationVisualizationComp<OpT> = FunctionComponent<OperationProps<OpT>>;

export const makeOperationVisualization =
  <OpT extends unknown>(
    applicationSpecific: ApplicationSpecificOperationComponents<OpT>,
  ): OperationVisualizationComp<OpT> =>
    (props) => {
      const classes = useOperationStyles();
      const { className, style, operation, tooltipPlacement, ...otherProps } = props;

      const [tooltipContent, setTooltipContent] = useState<NonNullable<React.ReactNode>>("");
      const [selfOpenStatus, setSelfOpenStatus] = useState<SelfOpenStatus>(SelfOpenStatus.Closed);
      const [hoveredOperation, setHoveredOperation] = useOperationHoverState();

      useEffect(() => {
        if (
          selfOpenStatus === SelfOpenStatus.Closed &&
          hoveredOperation !== undefined &&
          isRelated(hoveredOperation, operation)
        ) {
          setTooltipContent(renderRelatedOperation(operation, hoveredOperation));
        } else if (selfOpenStatus === SelfOpenStatus.Closing && hoveredOperation === undefined) {
          setSelfOpenStatus(SelfOpenStatus.Closed);
        }
      }, [selfOpenStatus, hoveredOperation, operation]);

      const onOpen = useCallback(() => {
        setSelfOpenStatus(SelfOpenStatus.Open);
        setTooltipContent(renderOperation(applicationSpecific.renderOperation, operation));
        setHoveredOperation(operation);
      }, [operation, setHoveredOperation]);

      const onClose = useCallback(() => {
        setSelfOpenStatus(hoveredOperation ? SelfOpenStatus.Closing : SelfOpenStatus.Closed);
        setHoveredOperation(undefined);
      }, [hoveredOperation, setHoveredOperation]);

      const isRelatedOperationHovered =
        hoveredOperation !== undefined && isRelated(operation, hoveredOperation);

      return (
        <Tooltip
          key={operation.meta.id}
          arrow={true}
          classes={{ tooltip: classes.tooltip }}
          title={tooltipContent}
          open={selfOpenStatus === SelfOpenStatus.Open || isRelatedOperationHovered}
          placement={tooltipPlacement ?? "bottom"}
          onOpen={onOpen}
          onClose={onClose}
        >
          <span
            key={operation.meta.id}
            className={clsx(classes.operation, props.className)}
            style={{
              background: getClientColor(operation.meta.author),
              ...style,
            }}
            {...otherProps}
          />
        </Tooltip>
      );
    };
