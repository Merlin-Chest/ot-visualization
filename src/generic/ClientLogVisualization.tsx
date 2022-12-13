import React, { FunctionComponent, useCallback, useState } from "react";
import {
  ClientEntryType,
  ClientLogEntry,
  ReceivedOwnOperation,
  ReceivedOwnOperationAndSentBuffer,
  ReceivedServerOperationWhileAwaitingOperation,
  ReceivedServerOperationWhileAwaitingOperationWithBuffer,
  ReceivedServerOperationWhileSynchronized,
  UserEditAddedToBuffer,
  UserEditImmediatelySentToServer,
  UserEditStoredAsBuffer,
} from "./types/clientLog";
import { createUseStyles } from "react-jss";
import { ArrowDiagramArrowProps, makeArrowDiagram, SvgArrow } from "./ArrowDiagram";
import type { ClientLog, ClientLogItem, SynchronizationState } from "./types/visualizationState";
import { makeSynchronizationStateVisualization } from "./SynchronizationStateVisualization";
import type { ApplicationSpecificOperationComponents } from "./types/applicationSpecific";
import { makeOperationVisualization } from "./OperationVisualization";

const useStyles = createUseStyles({
  clientLog: {
    margin: "0 15px 20px",
    lineHeight: "24px",
  },
  clientLogItem: {
    transition: "margin 0.5s ease, height 0.5s ease",
    overflow: "hidden",
    position: "relative",
    "& > div": {
      position: "absolute",
      left: "0",
      right: "0",
      bottom: "0",
    },
  },
  clientLogEntry: {
    padding: "12px 20px 12px 40px",
  },
  inlineOperation: {
    margin: "0 2px",
    verticalAlign: "-4px",
  },
});

const makeClientLogItemVisualization = <OpT extends unknown>(
  applicationSpecific: ApplicationSpecificOperationComponents<OpT>,
): FunctionComponent<ClientLogItem<OpT>> => {
  const OperationVisualization = makeOperationVisualization(applicationSpecific);
  const SynchronizationStateVisualization =
    makeSynchronizationStateVisualization(OperationVisualization);
  const ArrowDiagram = makeArrowDiagram(OperationVisualization);

  const UserEditImmediatelySentToServerVisualization: FunctionComponent<
    UserEditImmediatelySentToServer<OpT>
  > = (logEntry) => {
    const classes = useStyles();

    return (
      <p>
        操作{" "}
        <OperationVisualization
          className={classes.inlineOperation}
          operation={logEntry.operation}
        />{" "}
        被发送到服务器。
      </p>
    );
  };

  const UserEditStoredAsBufferVisualization: FunctionComponent<UserEditStoredAsBuffer<OpT>> = (
    logEntry,
  ) => {
    const classes = useStyles();

    return (
      <p>
        操作{" "}
        <OperationVisualization
          className={classes.inlineOperation}
          operation={logEntry.operation}
        />{" "}
        被存储在缓冲区。
      </p>
    );
  };

  const UserEditAddedToBufferVisualization: FunctionComponent<UserEditAddedToBuffer<OpT>> = (
    logEntry,
  ) => {
    // TODO: render user edit
    return <p>新增用户操作到缓冲区</p>;
  };

  const ReceivedOwnOperationVisualization: FunctionComponent<ReceivedOwnOperation<OpT>> = (
    logEntry,
  ) => {
    const classes = useStyles();

    return (
      <p>
        收到自己的操作{" "}
        <OperationVisualization
          className={classes.inlineOperation}
          operation={logEntry.acknowledgedOperation}
        />
        .
      </p>
    );
  };

  const ReceivedOwnOperationAndSentBufferVisualization: FunctionComponent<
    ReceivedOwnOperationAndSentBuffer<OpT>
  > = (logEntry) => {
    const classes = useStyles();

    return (
      <p>
        接收到自己的操作{" "}
        <OperationVisualization
          className={classes.inlineOperation}
          operation={logEntry.acknowledgedOperation}
        />{" "}
        ，等待区：{" "}
        <OperationVisualization
          className={classes.inlineOperation}
          operation={logEntry.sentBuffer}
        />
        。
      </p>
    );
  };

  const ReceivedServerOperationWhileSynchronizedVisualization: FunctionComponent<
    ReceivedServerOperationWhileSynchronized<OpT>
  > = (logEntry) => {
    const classes = useStyles();

    return (
      <p>
        接收到来自服务器的操作{" "}
        <OperationVisualization
          className={classes.inlineOperation}
          operation={logEntry.receivedOperation}
        />{" "}
        并且立即应用。
      </p>
    );
  };

  const ReceivedServerOperationWhileAwaitingOperationVisualization: FunctionComponent<
    ReceivedServerOperationWhileAwaitingOperation<OpT>
  > = (logEntry) => {
    const {
      receivedOperation,
      transformedReceivedOperation,
      awaitedOperation,
      transformedAwaitedOperation,
    } = logEntry;
    const classes = useStyles();

    const topLeft = { x: 20, y: 15 };
    const topRight = { x: 125, y: 20 };
    const bottomLeft = { x: 15, y: 120 };
    const bottomRight = { x: 120, y: 125 };

    const arrows: ArrowDiagramArrowProps<OpT>[] = [
      {
        operation: awaitedOperation,
        start: topLeft,
        end: topRight,
        tooltipPlacement: "top",
      },
      {
        operation: transformedAwaitedOperation,
        start: bottomLeft,
        end: bottomRight,
        tooltipPlacement: "bottom",
      },
      {
        operation: receivedOperation,
        start: topLeft,
        end: bottomLeft,
        tooltipPlacement: "left",
      },
      {
        operation: transformedReceivedOperation,
        start: topRight,
        end: bottomRight,
        tooltipPlacement: "right",
      },
    ];

    return (
      <>
        <ArrowDiagram width={140} height={140} arrows={arrows} />
        <p style={{ marginTop: "4px" }}>
          接收到的 {" "}
          <OperationVisualization
            className={classes.inlineOperation}
            operation={receivedOperation}
          />{" "}
          与自己发送的{" "}
          <OperationVisualization
            className={classes.inlineOperation}
            operation={awaitedOperation}
          />{" "}发生冲突，解决冲突后：{" "}
          <OperationVisualization
            className={classes.inlineOperation}
            operation={transformedReceivedOperation}
          />{" "}
          和{" "}
          <OperationVisualization
            className={classes.inlineOperation}
            operation={transformedAwaitedOperation}
          />
          .
        </p>
      </>
    );
  };

  const ReceivedServerOperationWhileAwaitingOperationWithBufferVisualization: FunctionComponent<
    ReceivedServerOperationWhileAwaitingOperationWithBuffer<OpT>
  > = (logEntry) => {
    const {
      receivedOperation,
      onceTransformedReceivedOperation,
      twiceTransformedReceivedOperation,
      awaitedOperation,
      transformedAwaitedOperation,
      bufferOperation,
      transformedBufferOperation,
    } = logEntry;
    const classes = useStyles();

    const topLeft = { x: 20, y: 15 };
    const topCenter = { x: 125, y: 20 };
    const topRight = { x: 230, y: 25 };
    const bottomLeft = { x: 15, y: 120 };
    const bottomCenter = { x: 120, y: 125 };
    const bottomRight = { x: 225, y: 130 };

    const arrows: ArrowDiagramArrowProps<OpT>[] = [
      { operation: awaitedOperation, start: topLeft, end: topCenter, tooltipPlacement: "top" },
      {
        operation: transformedAwaitedOperation,
        start: bottomLeft,
        end: bottomCenter,
        tooltipPlacement: "bottom",
      },
      { operation: bufferOperation, start: topCenter, end: topRight, tooltipPlacement: "top" },
      {
        operation: transformedBufferOperation,
        start: bottomCenter,
        end: bottomRight,
        tooltipPlacement: "bottom",
      },
      {
        operation: receivedOperation,
        start: topLeft,
        end: bottomLeft,
        tooltipPlacement: "left",
      },
      {
        operation: onceTransformedReceivedOperation,
        start: topCenter,
        end: bottomCenter,
        tooltipPlacement: "bottom",
      },
      {
        operation: twiceTransformedReceivedOperation,
        start: topRight,
        end: bottomRight,
        tooltipPlacement: "right",
      },
    ];

    return (
      <>
        <ArrowDiagram width={245} height={145} arrows={arrows} />
        <p style={{ marginTop: "4px" }}>
          接收到的 {" "}
          <OperationVisualization
            className={classes.inlineOperation}
            operation={receivedOperation}
          />{" "}
          与自己发送的{" "}
          <OperationVisualization
            className={classes.inlineOperation}
            operation={awaitedOperation}
          />{" "}以及临时区{" "}
          <OperationVisualization className={classes.inlineOperation} operation={bufferOperation} />{" "}
          {" "}发生冲突，解决冲突后：{" "}
          <OperationVisualization
            className={classes.inlineOperation}
            operation={twiceTransformedReceivedOperation}
          />{" "}与{" "}<OperationVisualization
            className={classes.inlineOperation}
            operation={transformedAwaitedOperation}
          />{" "}
          ，新的临时区：
          <OperationVisualization
            className={classes.inlineOperation}
            operation={transformedBufferOperation}
          />
          .
        </p>
      </>
    );
  };

  const renderClientLogEntry = (
    clientLogEntry: ClientLogEntry<OpT>,
  ): NonNullable<React.ReactNode> => {
    switch (clientLogEntry.type) {
      case ClientEntryType.USER_EDIT_ADDED_TO_BUFFER:
        return <UserEditAddedToBufferVisualization {...clientLogEntry} />;
      case ClientEntryType.USER_EDIT_IMMEDIATELY_SENT_TO_SERVER:
        return <UserEditImmediatelySentToServerVisualization {...clientLogEntry} />;
      case ClientEntryType.USER_EDIT_STORED_AS_BUFFER:
        return <UserEditStoredAsBufferVisualization {...clientLogEntry} />;
      case ClientEntryType.RECEIVED_OWN_OPERATION:
        return <ReceivedOwnOperationVisualization {...clientLogEntry} />;
      case ClientEntryType.RECEIVED_OWN_OPERATION_AND_SENT_BUFFER:
        return <ReceivedOwnOperationAndSentBufferVisualization {...clientLogEntry} />;
      case ClientEntryType.RECEIVED_SERVER_OPERATION_WHILE_SYNCHRONIZED:
        return <ReceivedServerOperationWhileSynchronizedVisualization {...clientLogEntry} />;
      case ClientEntryType.RECEIVED_SERVER_OPERATION_WHILE_AWAITING_OPERATION:
        return <ReceivedServerOperationWhileAwaitingOperationVisualization {...clientLogEntry} />;
      case ClientEntryType.RECEIVED_SERVER_OPERATION_WHILE_AWAITING_OPERATION_WITH_BUFFER:
        return (
          <ReceivedServerOperationWhileAwaitingOperationWithBufferVisualization
            {...clientLogEntry}
          />
        );
    }
  };

  return ({ entry, newState }) => {
    const classes = useStyles();

    const [measuredHeight, setMeasuredHeight] = useState<number | undefined>(undefined);

    const setInnerDiv = useCallback((innerDiv: HTMLDivElement | null) => {
      if (innerDiv !== null) {
        const rect = innerDiv.getBoundingClientRect();
        setMeasuredHeight(rect.height);
      }
    }, []);

    return (
      <div
        className={classes.clientLogItem}
        style={
          measuredHeight === undefined
            ? { height: "1px", margin: "-100px 0 100px" }
            : { height: `${measuredHeight}px`, margin: "0" }
        }
      >
        <div ref={setInnerDiv}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="40"
            height={measuredHeight ?? "0"}
            style={{ position: "absolute", zIndex: -1 }}
          >
            <SvgArrow
              start={{ x: 20, y: (measuredHeight ?? 0) - 2 }}
              end={{ x: 20, y: 50 }}
              shaftWidth={8}
              tipLength={28}
              tipWidth={20}
              color="#eee"
            />
          </svg>
          <SynchronizationStateVisualization synchronizationState={newState} />
          <div className={classes.clientLogEntry}>{renderClientLogEntry(entry)}</div>
        </div>
      </div>
    );
  };
};

interface ClientLogVisualizationProps<OpT> {
  clientLog: ClientLog<OpT>;
  initialSynchronizationState: SynchronizationState<OpT>;
}

export const makeClientLogVisualization = <OpT extends unknown>(
  applicationSpecific: ApplicationSpecificOperationComponents<OpT>,
): FunctionComponent<ClientLogVisualizationProps<OpT>> => {
  const OperationVisualization = makeOperationVisualization(applicationSpecific);
  const SynchronizationStateVisualization =
    makeSynchronizationStateVisualization(OperationVisualization);
  const ClientLogItemVisualization = makeClientLogItemVisualization(applicationSpecific);

  return ({ clientLog, initialSynchronizationState }) => {
    const classes = useStyles();

    return (
      <div className={classes.clientLog}>
        {clientLog.map(({ entry, newState }, i) => (
          <ClientLogItemVisualization
            key={`log-entry-${clientLog.length - i}`}
            entry={entry}
            newState={newState}
          />
        ))}
        <SynchronizationStateVisualization synchronizationState={initialSynchronizationState} />
      </div>
    );
  };
};
