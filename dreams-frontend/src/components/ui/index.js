// UI components
// Legacy components (to be replaced gradually)
export { Button } from './Button';
export { default as Input } from './Input';
export { default as Card } from './Card';
export { default as LoadingSpinner } from './LoadingSpinner';
export { default as ErrorBoundary } from './ErrorBoundary';
export { default as LazyRoute } from './LazyRoute';
export { VirtualList } from './VirtualList';
export { default as ConfirmationModal } from './ConfirmationModal';
export { default as FormModal } from './FormModal';
export { default as OptimizedImage } from './OptimizedImage';

// shadcn/ui components
export { Button as ShadcnButton, buttonVariants } from './Button';
export { Input as ShadcnInput } from './Input';
export {
  Card as ShadcnCard,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
  CardActions,
  cardVariants
} from './Card';
export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogClose,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  dialogContentVariants,
} from './dialog';
export {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectLabel,
  SelectItem,
  SelectSeparator,
  SelectScrollUpButton,
  SelectScrollDownButton,
} from './select';
export { Tabs, TabsList, TabsTrigger, TabsContent } from './tabs';
export { Badge, badgeVariants } from './badge';
export { Avatar, AvatarImage, AvatarFallback } from './avatar';
export { Skeleton } from './skeleton';
export {
  SkeletonCard,
  SkeletonStatCard,
  SkeletonTableRow,
  SkeletonList,
  SkeletonPackageCard,
  SkeletonPortfolioCard,
  SkeletonTeamCard
} from './SkeletonCard';
export {
  Command,
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandShortcut,
  CommandSeparator,
} from './command';
export {
  Sheet,
  SheetPortal,
  SheetOverlay,
  SheetTrigger,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription,
} from './sheet';
export {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from './carousel';
export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
} from './table';
export { Progress } from './progress';
export { Spinner, spinnerVariants } from './spinner';
export { default as DataTable } from './DataTable';
export { default as StatsCard } from './StatsCard';
export { default as Timeline } from './Timeline';
export { default as ActivityFeed } from './ActivityFeed';
export { default as Breadcrumb } from './Breadcrumb';
export { default as BackToTop } from './BackToTop';
export { default as ScrollProgress } from './ScrollProgress';
export { default as FAQ } from './FAQ';
export { default as ShareButton } from './ShareButton';
export { default as FavoriteButton, useFavorites } from './FavoriteButton';

// New Phase 2 components
export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuGroup,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuRadioGroup,
} from './dropdown-menu';
export { Popover, PopoverTrigger, PopoverContent } from './popover';
export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from './tooltip';
export { Alert, AlertTitle, AlertDescription } from './alert';
export {
  AlertDialog,
  AlertDialogPortal,
  AlertDialogOverlay,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from './alert-dialog';
export { Separator } from './separator';
export { Switch } from './switch';
export { Checkbox } from './checkbox';
export { RadioGroup, RadioGroupItem } from './radio-group';
export { Slider } from './slider';
export { Calendar, CalendarDayButton } from './calendar';
export { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from './accordion';
export {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from './pagination';
export {
  Form,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
  FormField,
} from './form';
export { Label } from './label';
export { Textarea } from './textarea';
export { ToastProvider, ToastViewport, Toast, ToastTitle, ToastDescription, ToastClose, ToastAction } from './toast';
export { Toaster } from './toaster';
export { useToast } from '../../hooks/use-toast';

// Form components
export { default as FormBuilder } from './FormBuilder';
export { default as FormFieldWrapper } from './FormFieldWrapper';
export { default as FileUpload } from './FileUpload';
export { default as ImageUpload } from './ImageUpload';
export { default as RichTextEditor } from './RichTextEditor';
export { default as DatePicker } from './DatePicker';
export { default as TimePicker } from './TimePicker';
export { default as DateTimePicker } from './DateTimePicker';

// Utility components
export { default as EmptyState } from './EmptyState';
export { default as ErrorState } from './ErrorState';
export { StatusBadge } from './StatusBadge';
export { AvatarGroup } from './AvatarGroup';
export { TagInput } from './TagInput';
export { Rating } from './Rating';
export { PriceDisplay } from './PriceDisplay';
export { CountdownTimer } from './CountdownTimer';

