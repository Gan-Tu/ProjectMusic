import { Fragment, useState } from "react";
import { Dialog, Switch, Transition } from "@headlessui/react";
import Image from "next/image";

// const tabs = ["General", "Security", "Playlists"];

const tabs = [
  { name: "General", component: <GeneralTab /> },
  { name: "Security", component: <SecurityTab /> },
  { name: "Playlists", component: <PlaylistTab /> }
];

function classNames(...classes) {
  return classes.filter(Boolean).join(" ");
}

function TextInputGroup({ label, value }) {
  return (
    <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:py-5">
      <dt className="text-sm font-medium text-gray-500">{label}</dt>
      <dd className="mt-1 flex text-sm text-gray-900 sm:col-span-2 sm:mt-0">
        <span className="flex-grow">{value}</span>
        <span className="ml-4 flex-shrink-0">
          <button
            type="button"
            className="rounded-md bg-white font-medium text-pmred hover:text-pmred focus:outline-none focus:ring-2 focus:ring-pmred focus:ring-offset-2"
          >
            Edit
          </button>
        </span>
      </dd>
    </div>
  );
}

function SwitchToggle({ label, defaultToggle }) {
  const [isToggled, setIsToggled] = useState(defaultToggle);
  return (
    <Switch.Group as="div" className="py-4 flex justify-between ">
      <Switch.Label
        as="dt"
        className="text-sm font-medium text-gray-500"
        passive
      >
        {label}
      </Switch.Label>
      <dd className="mt-1 text-sm text-gray-900  sm:mt-0">
        <Switch
          checked={isToggled}
          onChange={setIsToggled}
          className={classNames(
            isToggled ? "bg-green-600" : "bg-gray-200",
            "relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 sm:ml-auto"
          )}
        >
          <span
            aria-hidden="true"
            className={classNames(
              isToggled ? "translate-x-5" : "translate-x-0",
              "inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out"
            )}
          />
        </Switch>
      </dd>
    </Switch.Group>
  );
}

function GeneralTab() {
  return (
    <dl className="divide-y divide-gray-200">
      <div className="grid grid-cols-3 gap-5">
        <div className="col-span-2">
          <div className="divide-y divide-gray-200">
            <TextInputGroup label="Name" value="Nick Breton" />
            <TextInputGroup label="Email" value="info@truthstudios.com" />
            <TextInputGroup label="Password" value="******" />
          </div>
        </div>
        <div className="col-span-1 flex flex-col place-items-center m-auto gap-2">
          <div className="relative h-20 w-20 rounded-sm">
            <div className="uppercase">
              <Image
                src="https://s3.amazonaws.com/projctmusic.com/party_favor_500x500_4517214868832703424.jpeg"
                layout="fill"
                objectFit="contain"
                objectPosition="left"
                alt="User logo"
              />
            </div>
          </div>
          <span className="text-sm font-medium text-pmred transparent-selection cursor-pointer">
            Upload Photo
          </span>
        </div>
      </div>
      <SwitchToggle label="Available to chat" defaultToggle={true} />
      <SwitchToggle label="Show Song DNA" defaultToggle={false} />
      <SwitchToggle label="Pop up messing" defaultToggle={true} />
    </dl>
  );
}

function SecurityTab() {
  const blockedUsers = ["SorryX", "AngleMC", "TestQuest", "CurseSoul"];
  return (
    <div className="py-5 px-3 transparent-selection">
      <span className="text-md font-medium text-gray-500">
        Blocked user list
      </span>
      <ul className="py-4 divide-gray-200 grid grid-cols-1 space-y-5">
        {blockedUsers.map((x, idx) => (
          <li className="flex border-b pb-4 justify-between" key={x}>
            <div className="justify-between flex">
              <span className="mr-5">0{idx + 1}.</span>
              <span className="text-pmred">{x}</span>
            </div>
            <span className="uppercase text-pmred flex justify-end text-sm font-semibold flex-1 cursor-pointer">
              Remove
            </span>
          </li>
        ))}
      </ul>
      <SwitchToggle
        label="Do not show messages from blocked users"
        defaultToggle={true}
      />
    </div>
  );
}

function PlaylistTab() {
  return (
    <div>
      <SwitchToggle label="Share Timeline Publicly" defaultToggle={true} />
      <SwitchToggle label="Share Playlist Publicly" defaultToggle={true} />
    </div>
  );
}

export default function SettingsModal({ isOpen, setIsOpen }) {
  const [curTabIndex, setCurTabIndex] = useState(0);
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
              <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white px-4 pt-5 pb-4 text-left shadow-xl transition-all my-8 w-full max-w-lg p-6">
                <Dialog.Title
                  as="h3"
                  className="text-md font-medium leading-6 text-gray-900 uppercase md:px-4 xl:px-0"
                >
                  Settings
                </Dialog.Title>
                <div className="max-w-xl flex-1">
                  <div className="relative mx-auto max-w-4xl md:px-4 xl:px-0">
                    <div className="px-2 sm:px-6 md:px-0">
                      <div className="py-2">
                        <div className="border-b border-gray-200">
                          <nav className="-mb-px flex space-x-8">
                            {tabs.map((tab, idx) => (
                              <button
                                key={tab.name}
                                onClick={() => setCurTabIndex(idx)}
                                className={classNames(
                                  idx == curTabIndex
                                    ? "border-pmred text-pmred"
                                    : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700",
                                  "whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm uppercase"
                                )}
                              >
                                {tab.name}
                              </button>
                            ))}
                          </nav>
                        </div>

                        <div className="divide-y divide-gray-200">
                          <div className="divide-y divide-gray-200">
                            {/* <GeneralTab /> */}
                            {tabs[curTabIndex].component}
                            <div className="pt-4 flex justify-end space-x-2">
                              <button
                                type="button"
                                onClick={() => setIsOpen(false)}
                                className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-full shadow-sm text-gray-600  focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 ring-gray-500 ring-2 outline-2 outline-gray-700"
                              >
                                Cancel
                              </button>
                              <button
                                type="button"
                                onClick={() => setIsOpen(false)}
                                className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-full shadow-sm text-white bg-pmred focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pmred"
                              >
                                Save Changes
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}
