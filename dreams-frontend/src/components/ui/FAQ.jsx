import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from './accordion';
import { cn } from '@/lib/utils';

const FAQ = ({
  items = [],
  type = 'single',
  defaultValue,
  className,
  itemClassName,
  allowMultiple = false,
}) => {
  if (items.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
        No FAQs available
      </div>
    );
  }

  return (
    <div className={cn('w-full', className)}>
      <Accordion
        type={allowMultiple ? 'multiple' : type}
        defaultValue={defaultValue}
        className="space-y-2"
      >
        {items.map((item, index) => (
          <AccordionItem
            key={item.id || item.question || index}
            value={item.id || item.value || `item-${index}`}
            className={cn(
              'border border-gray-200 dark:border-gray-800 rounded-lg px-4',
              itemClassName
            )}
          >
            <AccordionTrigger className="text-left hover:no-underline py-4">
              <span className="font-semibold text-gray-900 dark:text-gray-100">
                {item.question}
              </span>
            </AccordionTrigger>
            <AccordionContent className="pb-4">
              <div className="text-gray-600 dark:text-gray-400 leading-relaxed">
                {typeof item.answer === 'string' ? (
                  <p>{item.answer}</p>
                ) : (
                  item.answer
                )}
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
};

export default FAQ;

