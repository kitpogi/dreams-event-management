import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from './accordion';
import { cn } from '@/lib/utils';
import { HelpCircle, ChevronDown } from 'lucide-react';

const FAQ = ({
  items = [],
  type = 'single',
  defaultValue,
  className,
  itemClassName,
  allowMultiple = false,
  showIcons = true,
  variant = 'default', // 'default' or 'modern'
}) => {
  if (items.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
        <HelpCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
        <p>No FAQs available</p>
      </div>
    );
  }

  const isModern = variant === 'modern';

  return (
    <div className={cn('w-full', className)}>
      <Accordion
        type={allowMultiple ? 'multiple' : type}
        defaultValue={defaultValue}
        className={cn(
          isModern ? 'space-y-3' : 'space-y-2'
        )}
      >
        {items.map((item, index) => (
          <AccordionItem
            key={item.id || item.question || index}
            value={item.id || item.value || `item-${index}`}
            className={cn(
              isModern
                ? 'border-0 rounded-2xl bg-gradient-to-br from-gray-50/80 to-white dark:from-gray-800/50 dark:to-gray-900/50 backdrop-blur-sm shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden group'
                : 'border border-gray-200 dark:border-gray-800 rounded-lg px-4',
              itemClassName
            )}
          >
            <AccordionTrigger
              className={cn(
                isModern
                  ? 'text-left hover:no-underline py-5 px-5 hover:bg-gradient-to-r hover:from-[#a413ec]/5 hover:to-transparent transition-colors duration-200 [&[data-state=open]]:bg-gradient-to-r [&[data-state=open]]:from-[#a413ec]/10 [&[data-state=open]]:to-transparent'
                  : 'text-left hover:no-underline py-4'
              )}
            >
              <div className="flex items-start gap-4 flex-1">
                {showIcons && isModern && (
                  <div className="flex-shrink-0 mt-0.5">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#a413ec]/20 to-[#7c3aed]/20 dark:from-[#a413ec]/30 dark:to-[#7c3aed]/30 flex items-center justify-center group-hover:from-[#a413ec]/30 group-hover:to-[#7c3aed]/30 transition-all duration-200">
                      <HelpCircle className="w-4 h-4 text-[#a413ec] dark:text-[#7c3aed]" />
                    </div>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <span
                    className={cn(
                      isModern
                        ? 'font-semibold text-gray-900 dark:text-white text-sm sm:text-base leading-snug block group-hover:text-[#a413ec] dark:group-hover:text-[#7c3aed] transition-colors duration-200'
                        : 'font-semibold text-gray-900 dark:text-gray-100'
                    )}
                  >
                    {item.question}
                  </span>
                </div>
                {isModern && (
                  <ChevronDown className="w-5 h-5 text-gray-400 dark:text-gray-500 flex-shrink-0 transition-transform duration-200 group-hover:text-[#a413ec] dark:group-hover:text-[#7c3aed] [&[data-state=open]]:rotate-180" />
                )}
              </div>
            </AccordionTrigger>
            <AccordionContent
              className={cn(
                isModern
                  ? 'pb-5 px-5 pt-0 text-gray-700 dark:text-gray-300 leading-relaxed'
                  : 'pb-4'
              )}
            >
              <div
                className={cn(
                  isModern
                    ? 'pl-0 sm:pl-12 text-sm sm:text-base leading-relaxed space-y-2'
                    : 'text-gray-600 dark:text-gray-400 leading-relaxed'
                )}
              >
                {typeof item.answer === 'string' ? (
                  <p className={isModern ? 'text-gray-700 dark:text-gray-300' : ''}>
                    {item.answer}
                  </p>
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

