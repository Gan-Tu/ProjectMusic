import { Fragment, useState } from "react";
import { Dialog, Transition } from "@headlessui/react";

export default function CreditsModal({ isOpen, setIsOpen, curCredits }) {
  const [isPurchase, setIsPurchase] = useState(false);
  const [showThankYou, setShowThankYou] = useState(false);

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog
        as="div"
        className="relative z-10"
        onClose={() => setIsOpen(false)}
      >
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
          afterLeave={() => {
            setIsPurchase(false);
            setShowThankYou(false);
          }}
        >
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-full justify-center  text-center items-center p-0">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all my-8 w-full max-w-xs sm:max-w-lg px">
                {showThankYou ? (
                  <div className="p-20 text-pmred font-bold uppercase text-center text-xl">
                    Thank you for purchasing!
                  </div>
                ) : (
                  <>
                    <Dialog.Title
                      as="h3"
                      className="text-md font-medium leading-6 text-gray-900 uppercase px-6 shadow-sm py-4"
                    >
                      <div className="flex justify-between items-center transparent-selection">
                        <span>
                          {isPurchase ? "Confirm Purchase" : "Credits Purchase"}
                        </span>
                        <div>
                          <div className="flex flex-col text-center">
                            <span className="font-bold text-md text-pmred">
                              {curCredits}
                            </span>
                            <span className="text-gray-400 text-xs group-hover:text-white">
                              Credits
                            </span>
                          </div>
                        </div>
                      </div>
                    </Dialog.Title>
                    {isPurchase ? (
                      <PurchaseConfirmation
                        onClose={() => setIsOpen(false)}
                        onPurchase={() => setShowThankYou(true)}
                      />
                    ) : (
                      <PricingTable onPurchase={() => setIsPurchase(true)} />
                    )}
                  </>
                )}
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}

function PurchaseConfirmation({ onPurchase, onClose }) {
  return (
    <div className="px-10 py-6">
      <div>To confirm this purchase please enter your password:</div>
      <div className="mt-5">
        <input
          type="password"
          name="password"
          id="password"
          className="block w-full rounded-md border shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-4 py-2"
          placeholder="Your Password"
          aria-describedby="password"
        />
      </div>
      <div className="relative flex items-start mt-5">
        <div className="flex h-5 items-center">
          <input
            id="comments"
            aria-describedby="comments-description"
            name="comments"
            type="checkbox"
            className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
          />
        </div>
        <div className="ml-3 text-sm">
          <label htmlFor="comments" className="font-medium text-gray-700">
            Enable Quick Credit Purchase for Future
          </label>
          <p id="comments-description" className="text-gray-500">
            Check box to not display confirmation and automatically make
            purchase when clicked in future.
          </p>
        </div>
      </div>
      <div className="pt-4 flex justify-end space-x-2">
        <button
          type="button"
          onClick={onClose}
          className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-full shadow-sm text-gray-600  focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 ring-gray-500 ring-2 outline-2 outline-gray-700"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onPurchase}
          className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-full shadow-sm text-white bg-pmred focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pmred"
        >
          Purchase
        </button>
      </div>
    </div>
  );
}

function PricingTable({ onPurchase }) {
  return (
    <div className="p-5 space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 px-2 gap-5">
        <button onClick={onPurchase}>
          <CreditButton numCredits={100} price={0.99} />
        </button>
        <button onClick={onPurchase}>
          <CreditButton numCredits={500} price={4.99} />
        </button>
        <button onClick={onPurchase}>
          <CreditButton numCredits={1000} price={9.99} />
        </button>
        <button onClick={onPurchase}>
          <CreditButton numCredits={2000} price={19.99} />
        </button>
      </div>
    </div>
  );
}

function CreditButton({ numCredits, price }) {
  return (
    <div className="border px-5 py-3 flex uppercase items-center group text-pmred hover:bg-pmred hover:text-white cursor-pointer justify-center">
      <div className="flex flex-col text-center border-r pr-5">
        <span className="font-bold text-2xl">{numCredits}</span>
        <span className="text-gray-400 text-xs group-hover:text-white">
          Credits
        </span>
      </div>
      <div className="rounded-full border px-2 py-1 ml-5">${price}</div>
    </div>
  );
}
