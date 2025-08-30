import * as React from "react";

type CollapsibleContextValue = {
  open: boolean;
  setOpen: (open: boolean) => void;
  toggle: () => void;
};

const CollapsibleContext = React.createContext<CollapsibleContextValue | null>(
  null
);

function useCollapsibleContext(component: string) {
  const ctx = React.useContext(CollapsibleContext);
  if (!ctx) {
    throw new Error(`${component} must be used within <Collapsible>`);
  }
  return ctx;
}

export interface CollapsibleProps
  extends React.HTMLAttributes<HTMLDivElement> {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export const Collapsible = React.forwardRef<HTMLDivElement, CollapsibleProps>(
  ({ open: openProp, defaultOpen, onOpenChange, className, children, ...props }, ref) => {
    const isControlled = openProp !== undefined;
    const [uncontrolledOpen, setUncontrolledOpen] = React.useState(
      !!defaultOpen
    );

    const open = isControlled ? !!openProp : uncontrolledOpen;

    const setOpen = (next: boolean) => {
      if (!isControlled) {
        setUncontrolledOpen(next);
      }
      onOpenChange?.(next);
    };

    const toggle = () => setOpen(!open);

    return (
      <CollapsibleContext.Provider value={{ open, setOpen, toggle }}>
        <div ref={ref} className={className} {...props}>
          {children}
        </div>
      </CollapsibleContext.Provider>
    );
  }
);
Collapsible.displayName = "Collapsible";

export interface CollapsibleTriggerProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean;
}

export const CollapsibleTrigger = React.forwardRef<
  HTMLButtonElement,
  CollapsibleTriggerProps
>(({ asChild, className, onClick, children, ...props }, ref) => {
  const { toggle, open } = useCollapsibleContext("CollapsibleTrigger");

  const handleClick: React.MouseEventHandler<HTMLButtonElement> = (e) => {
    onClick?.(e);
    if (!e.defaultPrevented) {
      toggle();
    }
  };

  if (asChild && React.isValidElement(children)) {
    const child: any = children; // cloning with added props
    return React.cloneElement(child, {
      onClick: (e: any) => {
        child.props?.onClick?.(e);
        if (!e.defaultPrevented) toggle();
      },
      "aria-expanded": open,
      "data-state": open ? "open" : "closed",
    });
  }

  return (
    <button
      ref={ref}
      type="button"
      className={className}
      onClick={handleClick}
      aria-expanded={open}
      data-state={open ? "open" : "closed"}
      {...props}
    >
      {children}
    </button>
  );
});
CollapsibleTrigger.displayName = "CollapsibleTrigger";

export interface CollapsibleContentProps
  extends React.HTMLAttributes<HTMLDivElement> {}

export const CollapsibleContent = React.forwardRef<
  HTMLDivElement,
  CollapsibleContentProps
>(({ className, children, ...props }, ref) => {
  const { open } = useCollapsibleContext("CollapsibleContent");
  return (
    <div
      ref={ref}
      className={className}
      hidden={!open}
      aria-hidden={!open}
      data-state={open ? "open" : "closed"}
      {...props}
    >
      {children}
    </div>
  );
});
CollapsibleContent.displayName = "CollapsibleContent";

